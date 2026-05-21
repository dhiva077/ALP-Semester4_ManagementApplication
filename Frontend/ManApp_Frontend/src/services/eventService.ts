import { API_BASE, fetchJson } from './apiClient';

export type EventPayload = {
  user_id: number;
  name: string;
  description?: string | null;
  start_time: string;
  end_time: string;
  location: string;
  status_id: number;
};

type CacheEntry<T> = { data: T; timestamp: number };

const DEFAULT_TTL_MS = 60000;
let eventsCache: CacheEntry<any[]> | null = null;

export const fetchEvents = async (options?: { force?: boolean; ttlMs?: number }) => {
  const ttlMs = options?.ttlMs ?? DEFAULT_TTL_MS;
  const now = Date.now();
  if (!options?.force && eventsCache && now - eventsCache.timestamp < ttlMs) {
    return eventsCache.data;
  }

  const data = await fetchJson<any[]>(`${API_BASE}/events`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  eventsCache = { data, timestamp: now };
  return data;
};

export const createEvent = async (payload: EventPayload) => {
  const created = await fetchJson<any>(`${API_BASE}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  eventsCache = null;
  return created;
};

export const updateEvent = async (
  eventId: number,
  payload: Partial<EventPayload>
) => {
  const updated = await fetchJson<any>(`${API_BASE}/events/${eventId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  eventsCache = null;
  return updated;
};
