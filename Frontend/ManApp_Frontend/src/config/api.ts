/**
 * Centralized API Configuration
 *
 * Auto-detects the host machine running Expo dev server so you
 * do not need to update IPs manually. Falls back to localhost
 * when the dev host is unavailable.
 */
import Constants from 'expo-constants';

const PORT = '8000';

const getDevHost = () => {
  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoGo?.debuggerHost;
  if (!hostUri) return null;
  return hostUri.split(':')[0];
};

const DEV_HOST = getDevHost();

export const API_URL = `http://${DEV_HOST || 'localhost'}:${PORT}/api`;

export const API_CONFIG = {
  BASE_URL: API_URL,
  PORT,
  DEV_HOST,
};

export default API_CONFIG;
