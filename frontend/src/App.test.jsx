import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import App from './App';

vi.mock('./auth/AuthContext', () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => ({
    session: null,
    user: null,
    isAuthenticated: false,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    refreshSession: vi.fn(),
    hasRole: () => false,
  }),
}));

describe('App', () => {
  it('renders the login screen by default', async () => {
    render(<App />);
    expect(await screen.findByRole('heading', { name: /login/i })).toBeInTheDocument();
  });
});
