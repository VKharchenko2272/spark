import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { api, AUTH_STATE_EVENT, emitAuthState } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = async () => {
    try {
      const response = await api.get('/auth/session');
      setSession(response.data);
      return response.data;
    } catch (error) {
      if (error?.response?.status === 401) {
        setSession(null);
        return null;
      }

      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refreshSession();

    const handleAuthChange = (event) => {
      setSession(event.detail?.session ?? null);
      setIsLoading(false);
    };

    window.addEventListener(AUTH_STATE_EVENT, handleAuthChange);
    return () => window.removeEventListener(AUTH_STATE_EVENT, handleAuthChange);
  }, []);

  const login = async (credentials) => {
    const response = await api.post('/login', credentials);
    setSession(response.data);
    emitAuthState({ type: 'login', session: response.data });
    return response.data;
  };

  const logout = async () => {
    try {
      await api.post('/logout');
    } finally {
      setSession(null);
      emitAuthState({ type: 'logout', session: null });
    }
  };

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      isAuthenticated: Boolean(session?.authenticated),
      isLoading,
      login,
      logout,
      refreshSession,
      hasRole: (roles = []) => roles.includes(session?.user?.role),
    }),
    [isLoading, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }

  return context;
}
