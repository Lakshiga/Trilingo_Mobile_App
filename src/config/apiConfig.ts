import { Platform, NativeModules } from 'react-native';
import Constants from 'expo-constants';

// API Configuration for different environments
export const API_CONFIG = {
  // Update these URLs based on your development setup

  // For Android Emulator (most common)
  // Android emulator uses 10.0.2.2 to access host machine's localhost
  ANDROID_EMULATOR: 'http://10.0.2.2:5166/api',

  // For iOS Simulator
  // iOS simulator can access localhost directly
  IOS_SIMULATOR: 'http://localhost:5166/api',

  // For Physical Device (use your computer's IP address)
  // Current IP: 10.207.178.68
  // Find your IP: Windows: ipconfig | iOS/Mac: ifconfig | Linux: ip addr
  PHYSICAL_DEVICE: 'http://10.207.178.68:5166/api', // ✅ Configured with current IP

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
  try {
    const env = (process as any)?.env ?? {};
    const isProduction =
      env.EXPO_PUBLIC_ENV === 'production' ||
      env.NODE_ENV === 'production' ||
      env.EXPO_PUBLIC_FORCE_PROD === 'true';
    const enableLocalDev = env.EXPO_PUBLIC_ENABLE_LOCAL === 'true';

    // If local dev is enabled, prioritize local URLs
    if (enableLocalDev && !isProduction) {
      // Check for explicit local API URL first
      const manualOverride =
        (env.EXPO_PUBLIC_API_URL as string | undefined) ??
        (env.API_URL as string | undefined);
      
      // Only use manual override if it's a valid local URL (not NEW_IP placeholder)
      if (manualOverride && typeof manualOverride === 'string' && manualOverride.trim()) {
        const trimmed = manualOverride.trim();
        // Ignore placeholder values
        if (!trimmed.includes('NEW_IP') && !trimmed.includes('YOUR_IP')) {
          return normalizeApiUrl(trimmed);
        }
      }

      const manualDirect = env.EXPO_PUBLIC_API_DIRECT as string | undefined;
      if (manualDirect && typeof manualDirect === 'string' && manualDirect.trim()) {
        const trimmed = manualDirect.trim();
        if (!trimmed.includes('NEW_IP') && !trimmed.includes('YOUR_IP')) {
          return normalizeApiUrl(trimmed);
        }
      }

      // For local dev, try to derive host from runtime
      const host = deriveHostFromRuntime();
      if (host && typeof host === 'string' && host.trim()) {
        let resolvedHost = host;
        if (host === 'localhost' || host === '127.0.0.1') {
          resolvedHost = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
        }
        return `http://${resolvedHost}:5166/api`;
      }

      // If no host derived, use platform-specific local URLs
      if (Platform.OS === 'android') {
        return API_CONFIG.ANDROID_EMULATOR;
      }
      if (Platform.OS === 'ios') {
        return API_CONFIG.IOS_SIMULATOR;
      }
      if (Platform.OS === 'web') {
        return API_CONFIG.WEB;
      }

      // Fallback to physical device IP for Expo Go
      return API_CONFIG.PHYSICAL_DEVICE;
    }

    // Production mode or local dev not enabled - check for manual overrides
    const manualOverride =
      (env.EXPO_PUBLIC_API_URL as string | undefined) ??
      (env.API_URL as string | undefined);
    if (manualOverride && typeof manualOverride === 'string' && manualOverride.trim()) {
      const trimmed = manualOverride.trim();
      if (!trimmed.includes('NEW_IP') && !trimmed.includes('YOUR_IP')) {
        return normalizeApiUrl(trimmed);
      }
    }

    const manualDirect = env.EXPO_PUBLIC_API_DIRECT as string | undefined;
    if (manualDirect && typeof manualDirect === 'string' && manualDirect.trim()) {
      const trimmed = manualDirect.trim();
      if (!trimmed.includes('NEW_IP') && !trimmed.includes('YOUR_IP')) {
        return normalizeApiUrl(trimmed);
      }
    }

    const configured = getConfiguredApiUrl();
    if (configured && typeof configured === 'string' && configured.trim()) {
      return configured;
    }

    // Default to CloudFront unless local development is explicitly enabled
    if (isProduction || !enableLocalDev) {
      return API_CONFIG.PRODUCTION;
    }

    const host = deriveHostFromRuntime();
    if (host && typeof host === 'string' && host.trim()) {
      let resolvedHost = host;
      if (host === 'localhost' || host === '127.0.0.1') {
        resolvedHost = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
      }
      return `http://${resolvedHost}:5166/api`;
    }

    // If no host derived and local dev is enabled, check platform
    // For physical devices (Expo Go), use PHYSICAL_DEVICE IP
    // For emulators/simulators, use platform-specific URLs
    if (enableLocalDev) {
      // Try to detect if running on physical device vs emulator
      // If we can't derive host, it's likely a physical device
      // Use the configured physical device IP
      return API_CONFIG.PHYSICAL_DEVICE;
    }

    if (Platform.OS === 'android' && enableLocalDev) return API_CONFIG.ANDROID_EMULATOR;
    if (Platform.OS === 'ios' && enableLocalDev) return API_CONFIG.IOS_SIMULATOR;

    // Always return a valid URL - fallback to production
    return API_CONFIG.PRODUCTION;
  } catch (error) {
    console.error('Error getting API base URL:', error);
    // Always return a fallback URL
    return API_CONFIG.PRODUCTION;
  }
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

// Current API base URL - ensure it's never undefined
export const API_BASE_URL = getApiBaseUrl() || API_CONFIG.PRODUCTION;
export const API_TIMEOUT = 30000; // 30 seconds (increased for CloudFront)

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
