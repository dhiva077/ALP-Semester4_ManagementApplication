import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config/api';

const API_BASE = API_CONFIG.BASE_URL;
const TIMEOUT_MS = 30000;
const LOG_API = false;

const fetchWithTimeout = async (url: string, options: RequestInit) => {
  const controller = new AbortController();
  let timeoutId: any;
  const startTime = Date.now();

  try {
    if (LOG_API) console.log(`[API] ${options.method || 'GET'} ${url}`);
    timeoutId = setTimeout(() => {
      if (LOG_API) console.log(`[API] TIMEOUT ${Date.now() - startTime}ms`);
      controller.abort();
    }, TIMEOUT_MS);

    const response = await fetch(url, { ...options, signal: controller.signal });
    const elapsed = Date.now() - startTime;
    if (LOG_API) console.log(`[API] ${response.status} (${elapsed}ms)`);
    return response;
  } catch (err) {
    const elapsed = Date.now() - startTime;
    if (LOG_API) console.log(`[API] Error ${elapsed}ms: ${(err as Error).message}`);
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
};

export const loginService = async (email: string, password: string) => {
  try {
    if (LOG_API) console.log(`[LOGIN] ${email}`);
    if (LOG_API) console.log(`[LOGIN] Timeout: ${TIMEOUT_MS}ms`);
    const res = await fetchWithTimeout(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`${err.message || `Error ${res.status}`}`);
    }

    const data = await res.json();
    if (!data.user) throw new Error('No user in response');

    await AsyncStorage.multiSet([
      ['isLoggedIn', 'true'],
      ['authProvider', 'backend'],
      ['user', JSON.stringify(data.user)],
    ]);
    return data.user;
  } catch (error) {
    const msg = (error as Error).message;
    if (msg.includes('Aborted')) {
      const hostHint = API_CONFIG.DEV_HOST || 'localhost';
      throw new Error(`Timeout - Backend tidak merespons. Cek: 1) Backend jalan (php artisan serve)? 2) Device & PC sama network? 3) Ping ${hostHint}?`);
    }
    throw error;
  }
};

export const googleSignInService = async (user: { email?: string; name?: string }) => {
  if (!user.email) throw new Error('Missing email');
  try {
    const password = Math.random().toString(36).slice(-12) + 'A1!';
    const createRes = await fetchWithTimeout(`${API_BASE}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: user.name ?? 'Google User', email: user.email, password }),
    });

    if (createRes.ok) {
      const created = await createRes.json();
      const userData = created.user || created;
      await AsyncStorage.multiSet([
        ['isLoggedIn', 'true'],
        ['authProvider', 'google'],
        ['user', JSON.stringify(userData)],
      ]);
      return userData;
    }

    const listRes = await fetchWithTimeout(`${API_BASE}/users`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!listRes.ok) throw new Error('Gagal fetch users');
    const users = await listRes.json();
    const existing = users.find((u: any) => u.email?.toLowerCase() === user.email?.toLowerCase());
    if (!existing) throw new Error('User not found');

    await AsyncStorage.multiSet([
      ['isLoggedIn', 'true'],
      ['authProvider', 'google'],
      ['user', JSON.stringify(existing)],
    ]);
    return existing;
  } catch (error) {
    const msg = (error as Error).message;
    if (msg.includes('Aborted')) {
      throw new Error(`Timeout - Backend tidak merespons`);
    }
    throw error;
  }
};
