import axios from 'axios';

export const AUTH_STATE_EVENT = 'spark:auth-state-changed';

const legacyPathMatchers = [
  [/^\/login$/i, '/api/auth/login'],
  [/^\/logout$/i, '/api/auth/logout'],
  [/^\/auth\/session$/i, '/api/auth/session'],
  [/^\/session$/i, '/api/auth/session'],
  [/^\/departments$/i, '/api/departments'],
  [/^\/categories$/i, '/api/categories'],
  [/^\/employees-with-image$/i, '/api/users'],
  [/^\/employees\/(\d+)$/i, '/api/users/$1'],
  [/^\/users\/(\d+)$/i, '/api/users/$1'],
  [/^\/images\/(\d+)$/i, '/api/users/$1/image'],
  [/^\/edit\/(\d+)$/i, '/api/users/$1'],
  [/^\/eval\/(\d+)$/i, '/api/users/$1'],
  [/^\/evaluate\/user\/(\d+)$/i, '/api/evaluations/users/$1'],
  [/^\/status\/(\d+)$/i, '/api/evaluations/users/$1/status'],
  [/^\/rating\/(\d+)$/i, '/api/ratings/users/$1'],
  [/^\/evaluate$/i, '/api/evaluations'],
  [/^\/department-scores\/(\d+)$/i, '/api/metrics/department'],
  [/^\/manager-user-scores\/(\d+)$/i, '/api/metrics/users'],
];

function emitAuthState(detail) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(AUTH_STATE_EVENT, { detail }));
  }
}

export function normalizeApiPath(value = '') {
  const rawValue = String(value || '');
  const withoutHost = rawValue.replace(/^https?:\/\/localhost:(5212|7253)/i, '');
  const withLeadingSlash = withoutHost.startsWith('/') ? withoutHost : `/${withoutHost}`;

  if (/^\/api(\/|$)/i.test(withLeadingSlash)) {
    return withLeadingSlash;
  }

  for (const [matcher, replacement] of legacyPathMatchers) {
    if (matcher.test(withLeadingSlash)) {
      return withLeadingSlash.replace(matcher, replacement);
    }
  }

  if (/^\/auth\//i.test(withLeadingSlash)) {
    return `/api${withLeadingSlash}`;
  }

  return `/api${withLeadingSlash}`;
}

export function buildApiUrl(value) {
  return normalizeApiPath(value);
}

function getCookie(name) {
  if (typeof document === 'undefined') {
    return null;
  }

  const cookie = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.split('=').slice(1).join('=')) : null;
}

axios.defaults.withCredentials = true;
axios.defaults.xsrfCookieName = 'XSRF-TOKEN';
axios.defaults.xsrfHeaderName = 'X-CSRF-TOKEN';

axios.interceptors.request.use((config) => ({
  ...config,
  url: normalizeApiPath(config.url || ''),
}));

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      emitAuthState({ type: 'unauthorized', session: null });
    }

    return Promise.reject(error);
  }
);

export const api = axios;

export async function apiFetch(url, options = {}) {
  const method = String(options.method || 'GET').toUpperCase();
  const headers = new Headers(options.headers || {});

  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const csrfToken = getCookie('XSRF-TOKEN');
    if (csrfToken && !headers.has('X-CSRF-TOKEN')) {
      headers.set('X-CSRF-TOKEN', csrfToken);
    }
  }

  const response = await fetch(normalizeApiPath(url), {
    ...options,
    credentials: 'include',
    headers,
  });

  if (response.status === 401) {
    emitAuthState({ type: 'unauthorized', session: null });
  }

  return response;
}

export { emitAuthState };
