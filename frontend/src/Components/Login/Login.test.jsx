import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Login from './index';

const mocks = vi.hoisted(() => ({
  login: vi.fn(),
  navigate: vi.fn(),
  apiGet: vi.fn(),
}));

vi.mock('../../auth/AuthContext', () => ({
  useAuth: () => ({
    login: mocks.login,
  }),
}));

vi.mock('../../lib/api', () => ({
  api: {
    get: mocks.apiGet,
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mocks.navigate,
  };
});

describe('Login', () => {
  beforeEach(() => {
    mocks.login.mockReset();
    mocks.navigate.mockReset();
    mocks.apiGet.mockReset();
  });

  it('bootstraps csrf protection on mount', async () => {
    mocks.apiGet.mockResolvedValue({ status: 204 });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mocks.apiGet).toHaveBeenCalledWith('/auth/csrf');
    });

    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
  });
});
