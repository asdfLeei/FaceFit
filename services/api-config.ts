import Constants from 'expo-constants';
import { Platform } from 'react-native';

const CONFIGURED_URL = process.env.EXPO_PUBLIC_API_URL?.trim();
const API_PORT = process.env.EXPO_PUBLIC_API_PORT?.trim() || '3000';

function normalizeUrl(url: string) {
  const normalized = url.replace(/\/$/, '');
  if (!/^https?:\/\//i.test(normalized)) {
    throw new Error('EXPO_PUBLIC_API_URL must be "auto" or start with http:// or https://');
  }
  return normalized;
}

export function resolveApiUrl() {
  if (CONFIGURED_URL && CONFIGURED_URL.toLowerCase() !== 'auto') {
    return normalizeUrl(CONFIGURED_URL);
  }

  // The phone already reaches this host to load the Expo JavaScript bundle.
  // Reusing it prevents the API address from breaking when the Wi-Fi IP changes.
  const expoHost = Constants.expoConfig?.hostUri?.match(/^([^:]+)/)?.[1];
  if (expoHost) return `http://${expoHost}:${API_PORT}`;

  const fallbackHost = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
  return `http://${fallbackHost}:${API_PORT}`;
}

export const API_URL = resolveApiUrl();
