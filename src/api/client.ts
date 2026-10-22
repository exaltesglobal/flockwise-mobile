import { getApiUrl, isUsingMocks } from '@/lib/config';

import { mockRequest } from './mock';
import { ApiError } from './errors';
import type { ApiErrorBody } from './types';

export { ApiError };

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type AuthHooks = {
  getAccessToken: () => string | null;
  refresh: () => Promise<boolean>;
  onUnauthorized: () => void;
};

let auth: AuthHooks = {
  getAccessToken: () => null,
  refresh: async () => false,
  onUnauthorized: () => {},
};

/** Called once by the session provider so the client can attach and refresh tokens. */
export function configureAuth(hooks: AuthHooks) {
  auth = hooks;
}

const TIMEOUT_MS = 15_000;

export async function request<T>(method: Method, path: string, body?: unknown, retried = false): Promise<T> {
  if (isUsingMocks()) return mockRequest<T>(method, path, body);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const token = auth.getAccessToken();

  let res: Response;
  try {
    res = await fetch(`${getApiUrl()}${path}`, {
      method,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'X-Client': 'flockwise-mobile',
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    const aborted = e instanceof Error && e.name === 'AbortError';
    throw new ApiError(0, aborted ? 'timeout' : 'network', aborted ? 'The server took too long to respond.' : 'Could not reach the server.');
  } finally {
    clearTimeout(timer);
  }

  if (res.status === 401 && token && !retried) {
    if (await auth.refresh()) return request<T>(method, path, body, true);
    auth.onUnauthorized();
  }

  if (res.status === 204) return undefined as T;

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const err = (json as ApiErrorBody | null)?.error;
    throw new ApiError(res.status, err?.code ?? 'http_error', err?.message ?? `Request failed (${res.status})`, err?.fields);
  }
  return json as T;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body ?? {}),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body ?? {}),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body ?? {}),
  del: <T>(path: string) => request<T>('DELETE', path),
};
