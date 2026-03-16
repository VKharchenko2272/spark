import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AUTH_STATE_EVENT, apiFetch, buildApiUrl, normalizeApiPath } from './api';

describe('normalizeApiPath', () => {
  it('maps legacy urls to api routes', () => {
    expect(normalizeApiPath('http://localhost:5212/login')).toBe('/api/auth/login');
    expect(normalizeApiPath('/evaluate/user/42')).toBe('/api/evaluations/users/42');
    expect(buildApiUrl('/users/7/image')).toBe('/api/users/7/image');
  });

  it('keeps api routes stable', () => {
    expect(normalizeApiPath('/api/users')).toBe('/api/users');
  });
});

describe('apiFetch', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
    document.cookie = 'XSRF-TOKEN=test-token';
  });

  afterEach(() => {
    global.fetch = originalFetch;
    document.cookie = 'XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  });

  it('adds credentials, csrf header, and emits unauthorized events for 401 responses', async () => {
    const authStateListener = vi.fn();
    window.addEventListener(AUTH_STATE_EVENT, authStateListener);
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 401 });

    await apiFetch('/users', { method: 'POST' });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [path, options] = global.fetch.mock.calls[0];
    expect(path).toBe('/api/users');
    expect(options.credentials).toBe('include');
    expect(options.headers.get('X-CSRF-TOKEN')).toBe('test-token');
    expect(authStateListener).toHaveBeenCalledTimes(1);

    window.removeEventListener(AUTH_STATE_EVENT, authStateListener);
  });
});
