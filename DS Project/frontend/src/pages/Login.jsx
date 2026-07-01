import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await login(username, password);
    setLoading(false);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 420, background: '#1e293b', padding: '2.5rem', borderRadius: '1.5rem', border: '1px solid #334155', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🚦</div>
          <h2 style={{ color: '#f8fafc', fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>AI Traffic Analysis</h2>
          <p style={{ color: '#94a3b8', marginTop: '0.5rem', fontSize: '0.9rem' }}>Sign in to your account</p>
        </div>

        {error && (
          <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'rgba(239,68,68,0.15)', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.375rem' }}>Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              style={{ width: '100%', background: '#0f172a', border: '1px solid #475569', borderRadius: '0.5rem', padding: '0.625rem 0.875rem', color: '#f8fafc', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = '#2563eb'}
              onBlur={e => e.target.style.borderColor = '#475569'}
            />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.375rem' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{ width: '100%', background: '#0f172a', border: '1px solid #475569', borderRadius: '0.5rem', padding: '0.625rem 0.875rem', color: '#f8fafc', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = '#2563eb'}
              onBlur={e => e.target.style.borderColor = '#475569'}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', background: loading ? '#1e40af' : '#2563eb', color: '#fff', fontWeight: 600, padding: '0.75rem', borderRadius: '0.625rem', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '1rem', transition: 'background 0.2s' }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', color: '#94a3b8', marginTop: '1.5rem', fontSize: '0.875rem' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>Register</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
