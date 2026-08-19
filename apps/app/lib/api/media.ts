import { Platform } from 'react-native';

import { getApiAuthToken } from '@/lib/api/client';
import {
  getApiBaseUrl,
  getSupabaseStorageBucket,
  getSupabaseUrl,
  isUsingLocalDevApi,
} from '@/lib/api/config';

const STORAGE_PUBLIC_MARKER = '/storage/v1/object/public/';

function guessMime(uri: string): string {
  const lower = uri.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  return 'image/jpeg';
}

function guessName(uri: string): string {
  const parts = uri.split('/');
  const last = parts[parts.length - 1];
  if (last?.includes('.')) return last;
  return `upload-${Date.now()}.jpg`;
}

function isRemoteUrl(uri: string): boolean {
  return uri.startsWith('http://') || uri.startsWith('https://');
}

function isLocalDeviceUri(uri: string): boolean {
  return (
    uri.startsWith('file://') ||
    uri.startsWith('content://') ||
    uri.startsWith('blob:') ||
    uri.startsWith('data:')
  );
}

async function uriToUploadBody(
  localUri: string,
): Promise<{ body: FormData | Blob; contentType: string; filename: string }> {
  const filename = guessName(localUri);
  const contentType = guessMime(localUri);

  if (Platform.OS === 'web' || localUri.startsWith('blob:') || localUri.startsWith('data:')) {
    const response = await fetch(localUri);
    const blob = await response.blob();
    const formData = new FormData();
    formData.append('file', blob, filename);
    return { body: formData, contentType, filename };
  }

  const formData = new FormData();
  formData.append('file', {
    uri: localUri,
    name: filename,
    type: contentType,
  } as unknown as Blob);
  return { body: formData, contentType, filename };
}

/** Builds a Supabase Storage public URL (EXPO_PUBLIC_SUPABASE_URL). */
export function buildSupabasePublicUrl(objectPath: string): string {
  const publicBase = getSupabaseUrl().replace(/\/$/, '');
  const bucket = getSupabaseStorageBucket();
  const clean = objectPath.replace(/^\//, '');
  const key = clean.startsWith(`${bucket}/`) ? clean : `${bucket}/${clean}`;
  return `${publicBase}${STORAGE_PUBLIC_MARKER}${key}`;
}

/** Extracts bucket/path after /storage/v1/object/public/ from any Supabase storage URL. */
export function extractSupabaseObjectKey(url: string): string | null {
  const idx = url.indexOf(STORAGE_PUBLIC_MARKER);
  if (idx < 0) return null;
  return url.slice(idx + STORAGE_PUBLIC_MARKER.length);
}

/** Rewrites any Supabase storage URL (incl. localhost) to EXPO_PUBLIC_SUPABASE_URL. */
export function normalizeSupabaseStorageUrl(url: string): string {
  const objectKey = extractSupabaseObjectKey(url);
  if (!objectKey) return url;
  return buildSupabasePublicUrl(objectKey);
}

/** Storage path inside the bucket (e.g. uploads/file.jpg), without bucket prefix. */
export function extractStorageObjectPath(url: string): string | null {
  const key = extractSupabaseObjectKey(url);
  if (!key) return null;
  const bucket = getSupabaseStorageBucket();
  return key.startsWith(`${bucket}/`) ? key.slice(bucket.length + 1) : key;
}

/** Proxies a Supabase object through the Paw API (same host as auth/feed). */
export function getApiMediaProxyUrl(url: string): string | null {
  const objectPath = extractStorageObjectPath(url);
  if (!objectPath) return null;
  return `${getApiBaseUrl()}/media/object?path=${encodeURIComponent(objectPath)}`;
}

/**
 * Resolves a stored media reference to the URL used by <Image />.
 * Supabase assets always use https://<EXPO_PUBLIC_SUPABASE_URL>/storage/v1/object/public/...
 */
export function resolveMediaUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;
  const trimmed = url.trim();

  if (isLocalDeviceUri(trimmed)) {
    return trimmed;
  }

  if (
    trimmed.includes('localhost:8000') ||
    trimmed.includes('127.0.0.1:8000')
  ) {
    const normalized = normalizeSupabaseStorageUrl(trimmed);
    if (normalized !== trimmed) return normalized;
  }

  if (trimmed.includes(STORAGE_PUBLIC_MARKER)) {
    return normalizeSupabaseStorageUrl(trimmed);
  }

  if (!trimmed.includes('://')) {
    const bucket = getSupabaseStorageBucket();
    if (trimmed.startsWith('uploads/') || trimmed.startsWith(`${bucket}/`)) {
      return buildSupabasePublicUrl(trimmed);
    }
  }

  if (isRemoteUrl(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith('/uploads/')) {
    return `${getApiBaseUrl()}${trimmed}`;
  }

  if (trimmed.startsWith('/')) {
    return `${getApiBaseUrl()}${trimmed}`;
  }

  return trimmed;
}

export async function uploadMediaFromUri(localUri: string): Promise<string> {
  if (isRemoteUrl(localUri)) {
    return resolveMediaUrl(localUri) ?? localUri;
  }

  const token = getApiAuthToken();
  if (!token) {
    throw new Error('Sign in required before uploading photos.');
  }

  const { body } = await uriToUploadBody(localUri);

  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl()}/media/upload`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: body as FormData,
    });
  } catch (error) {
    const base = getApiBaseUrl();
    const hint =
      error instanceof Error && error.message === 'Network request failed'
        ? `Could not reach ${base}/media/upload. Check your connection or API URL.`
        : error instanceof Error
          ? error.message
          : 'Upload failed';
    throw new Error(hint);
  }

  const text = await response.text();
  const parsed = text ? (JSON.parse(text) as { url?: string; message?: string | string[] }) : null;
  if (!response.ok || !parsed?.url) {
    const message = parsed?.message;
    const detail = Array.isArray(message) ? message.join(', ') : message;
    throw new Error(detail ?? `Upload failed (${response.status})`);
  }

  const raw = parsed.url.startsWith('http')
    ? parsed.url
    : `${getApiBaseUrl()}${parsed.url.startsWith('/') ? '' : '/'}${parsed.url}`;

  return resolveMediaUrl(raw) ?? raw;
}

/**
 * Uploads local gallery/camera URIs and returns an https URL for API payloads.
 * Remote URLs are normalized to the public Supabase gateway (never file://).
 */
export async function resolveRemoteUri(localOrRemoteUri: string | null): Promise<string | null> {
  if (!localOrRemoteUri?.trim()) return null;
  const trimmed = localOrRemoteUri.trim();

  if (isRemoteUrl(trimmed)) {
    const normalized = resolveMediaUrl(trimmed);
    return normalized && isHttpUrl(normalized) ? normalized : null;
  }

  const uploaded = await uploadMediaFromUri(trimmed);
  return isHttpUrl(uploaded) ? uploaded : null;
}

export function isHttpUrl(uri: string | null | undefined): uri is string {
  return Boolean(uri && isRemoteUrl(uri));
}

export function resolvePostImageUrls(urls: string[] | undefined | null): string[] {
  if (!urls?.length) return [];
  return urls
    .map((u) => resolveMediaDisplayUrl(u))
    .filter((u): u is string => Boolean(u));
}

/** Primary display URL; falls back to API proxy when Supabase host is unreachable (LAN dev). */
export function resolveMediaDisplayUrl(url: string | null | undefined): string | null {
  const direct = resolveMediaUrl(url);
  if (!direct) return null;
  if (isUsingLocalDevApi() && extractStorageObjectPath(direct)) {
    return getApiMediaProxyUrl(direct) ?? direct;
  }
  return direct;
}

/** Alternate URL if the primary Supabase link fails to load in <Image />. */
export function resolveMediaDisplayFallback(url: string | null | undefined): string | null {
  const direct = resolveMediaUrl(url);
  if (!direct) return null;
  const proxy = getApiMediaProxyUrl(direct);
  if (!proxy || proxy === direct) return null;
  return proxy;
}

/** True when URL targets the configured public Supabase storage gateway. */
export function isSupabasePublicMediaUrl(url: string): boolean {
  const base = getSupabaseUrl().replace(/\/$/, '');
  return url.startsWith(base) && url.includes(STORAGE_PUBLIC_MARKER);
}
