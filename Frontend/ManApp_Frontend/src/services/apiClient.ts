import { API_CONFIG } from '../config/api';

const TIMEOUT_MS = 30000;

export const API_BASE = API_CONFIG.BASE_URL;
export const API_ORIGIN = API_BASE.replace(/\/api\/?$/, '');

export const fetchWithTimeout = async (url: string, options: RequestInit) => {
  const controller = new AbortController();
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const startTime = Date.now();

  try {
    console.log(`[API] ${options.method || 'GET'} ${url}`);
    timeoutId = setTimeout(() => {
      console.log(`[API] TIMEOUT ${Date.now() - startTime}ms`);
      controller.abort();
    }, TIMEOUT_MS);

    const response = await fetch(url, { ...options, signal: controller.signal });
    const elapsed = Date.now() - startTime;
    console.log(`[API] ${response.status} (${elapsed}ms)`);
    return response;
  } catch (err) {
    const elapsed = Date.now() - startTime;
    console.log(`[API] Error ${elapsed}ms: ${(err as Error).message}`);
    throw err;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};

export const fetchJson = async <T>(url: string, options: RequestInit): Promise<T> => {
  const res = await fetchWithTimeout(url, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`${(err as any).message || `Error ${res.status}`}`);
  }
  return res.json();
};
