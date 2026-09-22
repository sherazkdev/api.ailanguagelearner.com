const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://127.0.0.1:3000';
const API_KEY = import.meta.env.VITE_API_KEY ?? 'dev-lingua-api-key-change-me';

export { API_BASE, API_KEY };

export async function api<T>(
  path: string,
  options: RequestInit & { json?: unknown } = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('x-api-key', API_KEY);
  if (options.json !== undefined) {
    headers.set('Content-Type', 'application/json');
  }
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    body: options.json !== undefined ? JSON.stringify(options.json) : options.body,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new Error(data?.error ?? `${res.status} ${text}`);
  }
  return data as T;
}
