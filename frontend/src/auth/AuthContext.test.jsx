import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';

const mocks = vi.hoisted(() => {
  const api = {
    get: vi.fn(),
    post: vi.fn(),
  };

  return {
    api,
    emitAuthState: vi.fn((detail) => {
      window.dispatchEvent(new CustomEvent('spark:auth-state-changed', { detail }));
    }),
  };
});

vi.mock('../lib/api', () => ({
  api: mocks.api,
  AUTH_STATE_EVENT: 'spark:auth-state-changed',
  emitAuthState: mocks.emitAuthState,
}));

function AuthConsumer() {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();

  return (
    <div>
      <p>{isLoading ? 'loading' : 'loaded'}</p>
      <p>{isAuthenticated ? 'authenticated' : 'guest'}</p>
      <p>{user?.firstname || 'no-user'}</p>
      <button onClick={() => login({ username: 'demo', password: 'secret' })}>login</button>
      <button onClick={() => logout()}>logout</button>
    </div>
  );
}

describe('AuthProvider', () => {
  beforeEach(() => {
    mocks.api.get.mockReset();
    mocks.api.post.mockReset();
    mocks.emitAuthState.mockClear();
  });

  it('bootstraps the session on mount', async () => {
    mocks.api.get.mockResolvedValue({
      data: {
        authenticated: true,
        user: { id: 1, firstname: 'Ada', role: 'admin' },
      },
    });

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    expect(await screen.findByText('Ada')).toBeInTheDocument();
    expect(screen.getByText('authenticated')).toBeInTheDocument();
    expect(mocks.api.get).toHaveBeenCalledWith('/auth/session');
  });

  it('supports login and logout flows', async () => {
    mocks.api.get.mockRejectedValueOnce({ response: { status: 401 } });
    mocks.api.post
      .mockResolvedValueOnce({
        data: {
          authenticated: true,
          user: { id: 2, firstname: 'Mina', role: 'manager' },
        },
      })
      .mockResolvedValueOnce({});

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    expect(await screen.findByText('guest')).toBeInTheDocument();

    fireEvent.click(screen.getByText('login'));
    expect(await screen.findByText('Mina')).toBeInTheDocument();
    expect(screen.getByText('authenticated')).toBeInTheDocument();

    fireEvent.click(screen.getByText('logout'));
    expect(await screen.findByText('guest')).toBeInTheDocument();
    expect(screen.getByText('no-user')).toBeInTheDocument();
  });
});
