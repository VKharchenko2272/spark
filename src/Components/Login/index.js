import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import './login-style.css';
import { useAuth } from '../../auth/AuthContext';
import { api } from '../../lib/api';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    let isMounted = true;

    const bootstrapCsrf = async () => {
      try {
        await api.get('/auth/csrf');
      } catch (csrfError) {
        if (isMounted) {
          setError(csrfError?.response?.data?.message || 'Unable to prepare login security checks.');
        }
      }
    };

    void bootstrapCsrf();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const session = await login({ username, password });

      if (session?.user?.id) {
        navigate(`/home/${session.user.id}`);
      }
    } catch (loginError) {
      setError(loginError?.response?.data?.message || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="login-wrapper min-vh-100">
      <Helmet>
        <title>Login</title>
      </Helmet>
      <h1 className="login-title">Login</h1>
      <form className="form-row flex-column gy-5" onSubmit={handleLogin}>
        <input
          name="input-login"
          className="form-control mb-2"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          name="input-password"
          className="form-control  mb-2"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="btn btn-primary col-12">Login</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

export default Login;
