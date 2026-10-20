/**
 * Typed fetch wrapper for the CMS API with CSRF support.
 */

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

let csrfToken: string | null = null;

export const setCsrfToken = (token: string | null): void => {
  csrfToken = token;
};

export const getCsrfToken = (): string | null => csrfToken;

export type ApiRequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
  headers?: HeadersInit;
};

export const apiFetch = async <T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> => {
  const method = options.method ?? 'GET';
  const headers = new Headers(options.headers);

  let body: BodyInit | undefined;
  if (options.body !== undefined) {
    if (options.body instanceof FormData) {
      body = options.body;
    } else {
      headers.set('content-type', 'application/json');
      body = JSON.stringify(options.body);
    }
  }

  if (!SAFE_METHODS.has(method) && csrfToken) {
    headers.set('x-csrf-token', csrfToken);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body,
    credentials: 'include',
    signal: options.signal,
  });

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  const data = text ? (JSON.parse(text) as unknown) : null;

  if (!response.ok) {
    const error = (data as { error?: { code?: string; message?: string; details?: unknown } })
      ?.error;
    throw new ApiError(
      response.status,
      error?.code ?? 'request_failed',
      error?.message ?? response.statusText ?? 'Request failed',
      error?.details,
    );
  }

  return data as T;
};

class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export { ApiError };
