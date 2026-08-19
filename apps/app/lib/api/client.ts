import { getApiBaseUrl } from '@/lib/api/config';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  token?: string | null;
};

let authToken: string | null = null;

const DEFAULT_REQUEST_TIMEOUT_MS = 15_000;

export function setApiAuthToken(token: string | null) {
  authToken = token;
}

export function getApiAuthToken() {
  return authToken;
}

export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
  label = 'Request',
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(
      () => reject(new ApiError(`${label} timed out after ${timeoutMs}ms`, 0)),
      timeoutMs,
    );
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, token, headers, ...rest } = options;
  const auth = token ?? authToken;
  const url = `${getApiBaseUrl()}${path}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      ...rest,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined && !(body instanceof FormData)
          ? { 'Content-Type': 'application/json' }
          : {}),
        ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
        ...headers,
      },
      body:
        body === undefined
          ? undefined
          : body instanceof FormData
            ? body
            : JSON.stringify(body),
    });
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError(`Request timed out: ${url}`, 0);
    }
    const baseHint =
      error instanceof Error && error.message === 'Network request failed'
        ? `Could not reach ${url}. If you are on Expo Go, ensure the backend is running and reachable on your network.`
        : error instanceof Error
          ? error.message
          : 'Network request failed';
    const cause =
      __DEV__ && error instanceof Error && error.cause instanceof Error
        ? ` (${error.cause.message})`
        : '';
    throw new ApiError(`${baseHint}${cause}`, 0);
  } finally {
    clearTimeout(timeoutId);
  }

  const text = await response.text();
  const parsed = text ? (JSON.parse(text) as unknown) : null;

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    if (typeof parsed === 'object' && parsed !== null && 'message' in parsed) {
      const raw = (parsed as { message: unknown }).message;
      if (typeof raw === 'string') message = raw;
      else if (Array.isArray(raw)) message = raw.map(String).join(', ');
    }
    throw new ApiError(message, response.status, parsed);
  }

  return parsed as T;
}
