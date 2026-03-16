import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PrivateRoute from './index';

const mocked = vi.hoisted(() => ({
  authState: {
    user: null,
    isAuthenticated: false,
    isLoading: false,
  },
}));

vi.mock('../../auth/AuthContext', () => ({
  useAuth: () => mocked.authState,
}));

describe('PrivateRoute', () => {
  beforeEach(() => {
    mocked.authState.user = null;
    mocked.authState.isAuthenticated = false;
    mocked.authState.isLoading = false;
  });

  it('redirects unauthenticated users to login', () => {
    render(
      <MemoryRouter
        initialEntries={['/home/1']}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Routes>
          <Route path="/Login" element={<div>Login page</div>} />
          <Route
            path="/home/:id"
            element={
              <PrivateRoute allowedRoles={['admin', 'manager', 'employee']}>
                <div>Protected page</div>
              </PrivateRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Login page')).toBeInTheDocument();
  });

  it('blocks employees from accessing another employee page', () => {
    mocked.authState.user = { id: 7, role: 'employee' };
    mocked.authState.isAuthenticated = true;

    render(
      <MemoryRouter
        initialEntries={['/home/9']}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Routes>
          <Route path="/Login" element={<div>Login page</div>} />
          <Route
            path="/home/:id"
            element={
              <PrivateRoute allowedRoles={['admin', 'manager', 'employee']}>
                <div>Protected page</div>
              </PrivateRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Login page')).toBeInTheDocument();
  });

  it('allows access for valid roles to their own page', () => {
    mocked.authState.user = { id: 7, role: 'employee' };
    mocked.authState.isAuthenticated = true;

    render(
      <MemoryRouter
        initialEntries={['/home/7']}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Routes>
          <Route path="/Login" element={<div>Login page</div>} />
          <Route
            path="/home/:id"
            element={
              <PrivateRoute allowedRoles={['admin', 'manager', 'employee']}>
                <div>Protected page</div>
              </PrivateRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected page')).toBeInTheDocument();
  });
});
