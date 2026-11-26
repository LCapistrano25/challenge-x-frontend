import axios, { AxiosHeaders, isAxiosError } from 'axios';
import { env } from '@/shared/config/env';

let cachedCsrfToken: string | null = null;
let csrfPromise: Promise<string | null> | null = null;
let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

export function setCsrfToken(token: string | null) {
  cachedCsrfToken = token;
}

/**
 * Único cliente HTTP da aplicação. Sessão via cookie httpOnly (`withCredentials`) e
 * proteção CSRF via cookie/header `X-CSRFToken`.
 */
export const http = axios.create({
  baseURL: env.apiUrl,
  withCredentials: true,
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken',
  headers: { 'Content-Type': 'application/json' },

  // No ambiente de testes, utiliza Fetch para permitir a interceptação pelo MSW.
  ...(import.meta.env.MODE === 'test' ? { adapter: 'fetch' as const } : {}),
});

/** Solicita o cookie/token CSRF ao backend (GET /api/auth/csrf). */
export async function refreshCsrfToken(): Promise<string | null> {
  if (!csrfPromise) {
    csrfPromise = http
      .get<{ csrfToken?: string }>('/api/auth/csrf')
      .then(({ data }) => {
        cachedCsrfToken = data?.csrfToken ?? null;
        return cachedCsrfToken;
      })
      .catch(() => null)
      .finally(() => {
        csrfPromise = null;
      });
  }
  return csrfPromise;
}

const SAFE_METHODS = new Set(['get', 'head', 'options', 'trace']);

http.interceptors.request.use((config) => {
  const headers = AxiosHeaders.from(config.headers);
  if (config.data instanceof FormData) {
    // O navegador define o Content-Type com o boundary do multipart automaticamente.
    headers.delete('Content-Type');
  }
  const method = (config.method ?? 'get').toLowerCase();
  if (!SAFE_METHODS.has(method) && cachedCsrfToken && !headers.has('X-CSRFToken')) {
    headers.set('X-CSRFToken', cachedCsrfToken);
  }
  config.headers = headers;
  return config;
});

const PUBLIC_AUTH_401_PATHS = [
  '/api/auth/me',
  '/api/auth/csrf',
  '/api/auth/sessions/password',
  '/api/auth/sessions/microsoft',
];

http.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (isAxiosError(error) && error.response?.status === 401) {
      const url = error.config?.url ?? '';
      const isPublicAuth = PUBLIC_AUTH_401_PATHS.some((path) => url.includes(path));
      if (!isPublicAuth) {
        onUnauthorized?.();
      }
    }
    return Promise.reject(error);
  },
);
