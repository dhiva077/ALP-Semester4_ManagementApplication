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

export const fetchEvents = async () => {
  return fetchJson<any[]>(`${API_BASE}/events`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
};

export const createEvent = async (payload: EventPayload) => {
  return fetchJson<any>(`${API_BASE}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
};
