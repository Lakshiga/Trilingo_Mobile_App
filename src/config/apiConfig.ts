import { Platform, NativeModules } from 'react-native';
import Constants from 'expo-constants';

// API Configuration for different environments
export const API_CONFIG = {
  // Update these URLs based on your development setup

  // For Android Emulator (most common)
  ANDROID_EMULATOR: 'http://10.0.2.2:5166/api',

  // For iOS Simulator
  IOS_SIMULATOR: 'https://d3v81eez8ecmto.cloudfront.net/api',

  // For Physical Device (use your computer's IP address)
  PHYSICAL_DEVICE: 'http://172.22.126.148:5166/api', // TODO: replace with your local machine IPv4

  // For Web/Expo Go
  WEB: 'http://localhost:5166/api',

  // Production URL (CloudFront)
  PRODUCTION: 'https://d3v81eez8ecmto.cloudfront.net/api',
  
  // CloudFront URL for static assets
  CLOUDFRONT: 'https://d3v81eez8ecmto.cloudfront.net',
};

const normalizeApiUrl = (url: string): string => {
  const trimmed = url.replace(/\/$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

const extractHost = (value?: string | null): string | null => {
  if (!value) return null;
  const cleaned = value.replace(/^(https?:\/\/|wss?:\/\/|ws:\/\/|exp:\/\/)/, '');
  const parts = cleaned.split('/')[0];
  const host = parts.split(':')[0];
  return host || null;
};

const getConfiguredApiUrl = (): string | null => {
  try {
    const expoConfig: Record<string, any> | undefined = Constants.expoConfig as any;
    const manifest: Record<string, any> | undefined = (Constants as any).manifest;
    const extras =
      expoConfig?.extra ??
      manifest?.extra ??
      expoConfig?.expoGoConfig?.extra ??
      manifest?.expoGoConfig?.extra;

    const candidate =
      (extras?.apiBaseUrl as string | undefined) ??
      (extras?.apiUrl as string | undefined) ??
      (extras?.API_BASE_URL as string | undefined);

    if (candidate && typeof candidate === 'string') {
      return normalizeApiUrl(candidate);
    }
  } catch {}
  return null;
};

const deriveHostFromRuntime = (): string | null => {
  try {
    const source = (NativeModules as any)?.SourceCode;
    const scriptURL: string | undefined = source?.scriptURL;
    if (scriptURL) {
      const host = extractHost(scriptURL);
      if (host) return host;
    }
  } catch {}

  try {
    const expoHost =
      extractHost((Constants as any)?.expoConfig?.hostUri) ??
      extractHost((Constants as any)?.expoConfig?.debuggerHost) ??
      extractHost((Constants as any)?.manifest?.hostUri) ??
      extractHost((Constants as any)?.manifest2?.extra?.expoClient?.host ?? undefined) ??
      extractHost((Constants as any)?.expoGoConfig?.hostUri);

    if (expoHost) {
      return expoHost;
    }
  } catch {}

  try {
    if (typeof window !== 'undefined' && (window as any).location?.hostname) {
      return (window as any).location.hostname as string;
    }
  } catch {}
  return null;
};

export const getApiBaseUrl = (): string => {
  const env = (process as any)?.env ?? {};
  const isProduction =
    env.EXPO_PUBLIC_ENV === 'production' ||
    env.NODE_ENV === 'production' ||
    env.EXPO_PUBLIC_FORCE_PROD === 'true';
  const enableLocalDev = env.EXPO_PUBLIC_ENABLE_LOCAL === 'true';

  const manualOverride =
    (env.EXPO_PUBLIC_API_URL as string | undefined) ??
    (env.API_URL as string | undefined);
  if (manualOverride) {
    return normalizeApiUrl(manualOverride);
  }

  const manualDirect = env.EXPO_PUBLIC_API_DIRECT as string | undefined;
  if (manualDirect) {
    return normalizeApiUrl(manualDirect);
  }

  const configured = getConfiguredApiUrl();
  if (configured) {
    return configured;
  }

  // Default to CloudFront unless local development is explicitly enabled
  if (isProduction || !enableLocalDev) {
    return API_CONFIG.PRODUCTION;
  }

  const host = deriveHostFromRuntime();
  if (host) {
    let resolvedHost = host;
    if (host === 'localhost' || host === '127.0.0.1') {
      resolvedHost = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
    }
    return `http://${resolvedHost}:5166/api`;
  }

  if (Platform.OS === 'android' && enableLocalDev) return API_CONFIG.ANDROID_EMULATOR;
  if (Platform.OS === 'ios' && enableLocalDev) return API_CONFIG.IOS_SIMULATOR;

  return API_CONFIG.PRODUCTION;
};

// Fallback URLs for testing
const derivedHost = deriveHostFromRuntime();
const configuredUrl = getConfiguredApiUrl();
export const FALLBACK_URLS = [
  API_CONFIG.PRODUCTION,
  configuredUrl ? configuredUrl : '',
  API_CONFIG.PHYSICAL_DEVICE,
  API_CONFIG.ANDROID_EMULATOR,
  API_CONFIG.IOS_SIMULATOR,
  derivedHost
    ? `http://${
        derivedHost === 'localhost' || derivedHost === '127.0.0.1'
          ? Platform.OS === 'android'
            ? '10.0.2.2'
            : 'localhost'
          : derivedHost
      }:5166/api`
    : '',
].filter((value) => typeof value === 'string' && value.length > 0) as string[];

// Current API base URL
export const API_BASE_URL = getApiBaseUrl();
export const API_TIMEOUT = 10000; // 10 seconds

// CloudFront URL for static assets (images, etc.)
export const CLOUDFRONT_URL = API_CONFIG.CLOUDFRONT;

// Instructions for updating the URL:
/*
1. Android Emulator: Use API_CONFIG.ANDROID_EMULATOR (http://10.0.2.2:5166/api)
2. iOS Simulator: Use API_CONFIG.IOS_SIMULATOR (http://localhost:5166/api)
3. Physical Device: 
   - Find your computer's IP address (run: ipconfig or ifconfig)
   - Update API_CONFIG.PHYSICAL_DEVICE with your IP (e.g., http://192.168.1.100:5166/api)
   - Use API_CONFIG.PHYSICAL_DEVICE
4. Expo Go: Usually works with physical device URL
5. Web: Use API_CONFIG.WEB (http://localhost:5166/api)

To change the environment, modify the return statement in getApiBaseUrl()
*/
