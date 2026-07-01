import React, { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link, useLocation } from 'react-router-dom';

const S = {
  sidebar: {
    width: 240,
    minWidth: 240,
    height: '100vh',
    background: '#1e293b',
    borderRight: '1px solid #334155',
    display: 'flex',
    flexDirection: 'column',
    position: 'sticky',
    top: 0,
    zIndex: 10,
    fontFamily: 'Inter, sans-serif',
  },
  logo: {
    padding: '1.5rem 1.25rem',
    borderBottom: '1px solid #334155',
    display: 'flex',
    alignItems: 'center',
    gap: '0.625rem',
  },
  main: {
    flex: 1,
    minHeight: '100vh',
    background: '#0f172a',
    padding: '2rem',
    fontFamily: 'Inter, sans-serif',
    color: '#f8fafc',
    boxSizing: 'border-box',
    overflowX: 'hidden',
  }
};

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: '📊' },
  { name: 'Prediction', path: '/predict', icon: '🤖' },
  { name: 'Map View', path: '/map', icon: '🗺️' },
];

const Layout = ({ children }) => {
  const { logout, user } = useContext(AuthContext);
  const location = useLocation();

  return (
    <div style={{ display: 'flex', background: '#0f172a', minHeight: '100vh' }}>
      {/* Sidebar */}
      <div style={S.sidebar}>
        <div style={S.logo}>
          <span style={{ fontSize: '1.5rem' }}>🚦</span>
          <div>
            <div style={{ color: '#f8fafc', fontWeight: 700, fontSize: '1rem', lineHeight: 1.2 }}>AI Traffic</div>
            <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>Analysis System</div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          {navItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.7rem 1rem', borderRadius: '0.625rem',
                  color: isActive ? '#fff' : '#94a3b8',
                  background: isActive ? '#2563eb' : 'transparent',
                  textDecoration: 'none', fontWeight: isActive ? 600 : 400,
                  fontSize: '0.9rem', transition: 'all 0.15s',
                }}
              >
                <span>{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: '1rem', borderTop: '1px solid #334155' }}>
          {user && (
            <div style={{ marginBottom: '0.75rem', padding: '0.625rem', background: '#0f172a', borderRadius: '0.5rem' }}>
              <div style={{ color: '#f8fafc', fontSize: '0.875rem', fontWeight: 600 }}>{user.username}</div>
              <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{user.role}</div>
            </div>
          )}
          <button
            onClick={logout}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.7rem 1rem', borderRadius: '0.625rem', border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontSize: '0.9rem', textAlign: 'left' }}
          >
            🚪 Logout
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={S.main}>
        {children}
      </div>
    </div>
  );
};

export default Layout;
