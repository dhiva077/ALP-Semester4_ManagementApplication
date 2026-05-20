import { API_BASE, API_ORIGIN, fetchJson, fetchWithTimeout } from './apiClient';

export type FileStatusCode = 'B' | 'R' | 'S';

export const fetchFiles = async () => {
  return fetchJson<any[]>(`${API_BASE}/files`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
};

export const uploadEventPdf = async (
  eventId: number,
  fileUri: string,
  fileName: string,
  expectedDocKey?: string
) => {
  const formData = new FormData();
  formData.append('event_id', String(eventId));
  formData.append('pdf_file', {
    uri: fileUri,
    name: fileName || `upload-${Date.now()}.pdf`,
    type: 'application/pdf',
  } as any);
  if (expectedDocKey) {
    formData.append('expected_doc_key', expectedDocKey);
  }

  const res = await fetchWithTimeout(`${API_BASE}/files/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`${(err as any).message || `Error ${res.status}`}`);
  }

  return res.json();
};

export const updateFileStatus = async (
  eventId: number,
  docKey: string,
  statusCode: FileStatusCode
) => {
  return fetchJson<any>(`${API_BASE}/files/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event_id: eventId, doc_key: docKey, status_code: statusCode }),
  });
};

export const buildFileUrl = (path?: string | null) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const normalized = path.replace(/^\/?storage\//, '');
  return `${API_ORIGIN}/storage/${normalized}`;
};
