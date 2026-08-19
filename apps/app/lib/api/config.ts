import Constants from 'expo-constants';
import { Platform } from 'react-native';

function trimUrl(url: string): string {
  return url.replace(/\/$/, '');
}

function getLanHost(): string | null {
  const debuggerHost =
    Constants.expoGoConfig?.debuggerHost ??
    (Constants.expoConfig as { hostUri?: string } | null)?.hostUri;
  if (!debuggerHost) return null;
  return debuggerHost.split(':')[0] ?? null;
}

function isPrivateLanHost(host: string): boolean {
  return (
    host === 'localhost' ||
    /^127\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^10\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
  );
}

/** Tailscale CGNAT range (100.64.0.0/10). */
function isTailscaleHost(host: string): boolean {
  return /^100\.(?:6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./.test(host);
}

function isDevReachableHost(host: string): boolean {
  return isPrivateLanHost(host) || isTailscaleHost(host);
}

function configuredPointsToLocalhost(configured: string): boolean {
  return (
    configured.includes('localhost') ||
    configured.includes('127.0.0.1') ||
    configured.includes('10.0.2.2')
  );
}

function resolveLocalApiUrl(base: string): string {
  if (!base.includes('localhost') && !base.includes('127.0.0.1')) {
    return base;
  }
  if (Platform.OS === 'android') {
    return base.replace(/localhost|127\.0\.0\.1/g, '10.0.2.2');
  }
  const lanHost = getLanHost();
  if (lanHost && Platform.OS !== 'web') {
    return base.replace(/localhost|127\.0\.0\.1/g, lanHost);
  }
  return base;
}

function getConfiguredApiUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();
  const extra = Constants.expoConfig?.extra as { apiUrl?: string } | undefined;
  return trimUrl(fromEnv || extra?.apiUrl || '');
}

export function getAppBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_APP_URL?.trim();
  if (fromEnv) return trimUrl(fromEnv);
  const extra = Constants.expoConfig?.extra as { appUrl?: string } | undefined;
  if (extra?.appUrl) return trimUrl(extra.appUrl);
  return 'https://paw-app.lz-plima1212.online';
}

/**
 * Dev URL resolution:
 * - Production builds always use EXPO_PUBLIC_API_URL.
 * - In Expo Go, use the remote URL from .env by default (works on any network).
 * - LAN backend (http://<metro-ip>:3001) when EXPO_PUBLIC_USE_LAN_API=true,
 *   EXPO_PUBLIC_API_URL points at localhost, or Metro is reached via Tailscale (100.x).
 * - EXPO_PUBLIC_USE_REMOTE_API=true forces the remote URL (same as default with prod .env).
 */
export function getApiBaseUrl(): string {
  const configured = getConfiguredApiUrl();
  const forceRemote = process.env.EXPO_PUBLIC_USE_REMOTE_API === 'true';
  const forceLan = process.env.EXPO_PUBLIC_USE_LAN_API === 'true';
  const lanHost = getLanHost();
  const useLanInDev =
    __DEV__ &&
    !forceRemote &&
    lanHost &&
    isDevReachableHost(lanHost) &&
    (forceLan ||
      isTailscaleHost(lanHost) ||
      !configured ||
      configuredPointsToLocalhost(configured));

  if (useLanInDev) {
    return `http://${lanHost}:3001`;
  }

  if (configured) {
    return resolveLocalApiUrl(configured);
  }

  const fallback =
    Platform.OS === 'android' ? 'http://10.0.2.2:3001' : 'http://localhost:3001';
  return resolveLocalApiUrl(fallback);
}

export function getSupabaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
  if (fromEnv) return trimUrl(fromEnv);
  const extra = Constants.expoConfig?.extra as { supabaseUrl?: string } | undefined;
  if (extra?.supabaseUrl) return trimUrl(extra.supabaseUrl);
  return 'https://supabase.lz-plima1212.online';
}

export function getSupabaseStorageBucket(): string {
  const fromEnv = process.env.EXPO_PUBLIC_SUPABASE_STORAGE_BUCKET?.trim();
  if (fromEnv) return fromEnv;
  const extra = Constants.expoConfig?.extra as { supabaseStorageBucket?: string } | undefined;
  if (extra?.supabaseStorageBucket) return extra.supabaseStorageBucket;
  return 'paw-media';
}

export function isUsingLocalDevApi(): boolean {
  const url = getApiBaseUrl();
  return url.startsWith('http://') && !url.includes('lz-plima1212.online');
}
