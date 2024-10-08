import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom'; // for redirecting to other pages after login
import axios from 'axios'; // or use fetch
import './login-style.css';

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async () => {
        try {
            const response = await axios.post('http://localhost:5212/login', {
                username,
                password
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.success) {
                // Store user information in local storage or context
                localStorage.setItem('username', response.data.username);

                // Redirect to home page or dashboard
                navigate('/');
            } else {
                setError(response.data.message);
            }
        } catch (error) {
            setError('Login failed. Please try again.');
            console.error(error);
        }
    };

    return (
        <div className="login-wrapper">
            <Helmet>
                <title>Login</title>
            </Helmet>

            <h1 className="login-title">Login</h1>
            <input
                name="input-login"
                className='login-input-field'
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
            />
            <input
                name="input-login"
                className='login-input-field'
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <button type="button" className="login-buttom" onClick={handleLogin}>Login</button>
            {error && <p style={{ color: 'red' }}>{error}</p>}

        </div>
    );
}

export default Login;
