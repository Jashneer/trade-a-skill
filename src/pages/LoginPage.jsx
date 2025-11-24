// src/pages/LoginPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
    const navigate = useNavigate();
    const { user, login } = useAuth();
    const [form, setForm] = useState({ email: '', password: '' });

    useEffect(() => {
        if (user?.isLoggedIn) {
            navigate('/profile');
        }
    }, [user, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleForgotPassword = () => {
        const email = window.prompt('Enter your account email for password recovery:');
        if (!email) return;
        const users = JSON.parse(localStorage.getItem('tradeASkillUsers') || '[]');
        const found = users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
        if (found) {
            alert(`Password recovery initiated for ${email}. Check your inbox (simulated).`);
        } else {
            alert('No account found with that email.');
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        (async () => {
            try {
                const { email, password } = form;
                const res = await fetch(`http://localhost:3000/users?email=${encodeURIComponent(email)}`);
                if (!res.ok) throw new Error('Failed to fetch user');
                const users = await res.json();
                const matched = users.find(u => u.email && u.email.toLowerCase() === (email || '').toLowerCase() && u.password === password);
                if (matched) {
                    login(matched);
                    navigate('/profile');
                } else {
                    alert('Invalid credentials.');
                }
            } catch (err) {
                console.error('Login error', err);
                alert('Unable to login — server may be unavailable.');
            }
        })();
    };

    return (
        <main className="signup-main">
            <div className="container">
                <div className="signup-container">
                    <div className="signup-header">
                        <h2>Sign In</h2>
                        <p>Welcome back — sign in to continue trading skills.</p>
                    </div>

                    <form className="signup-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="email">Email Address</label>
                            <input id="email" name="email" type="email" required placeholder="Enter your email" value={form.email} onChange={handleChange} />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <input id="password" name="password" type="password" required placeholder="Enter your password" value={form.password} onChange={handleChange} />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <button type="submit" className="btn btn-primary">Sign In</button>
                            <button type="button" onClick={handleForgotPassword} className="btn btn-outline">Forgot Password?</button>
                        </div>

                        <div className="signup-footer" style={{ marginTop: '12px' }}>
                            <p>Don't have an account? <Link to="/signup">Create one</Link></p>
                        </div>
                    </form>
                </div>
            </div>
        </main>
    );
};

export default LoginPage;
