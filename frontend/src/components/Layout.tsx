import { type ReactNode } from 'react';
import { NavLink, type NavLinkRenderProps } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { glassNav, glassButton } from '../styles/glass';

const navStyle: React.CSSProperties = {
  ...glassNav,
  display: 'flex',
  alignItems: 'center',
  gap: 24,
  padding: '14px 28px',
  position: 'sticky',
  top: 0,
  zIndex: 10,
};

function linkStyle({ isActive }: NavLinkRenderProps): React.CSSProperties {
  return {
    textDecoration: 'none',
    color: isActive ? '#818cf8' : 'var(--text-muted)',
    fontWeight: isActive ? 600 : 500,
    fontSize: 15,
    padding: '6px 12px',
    borderRadius: 8,
    background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
  };
}

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      <nav style={navStyle}>
        <span style={{
          fontWeight: 700, fontSize: 18, marginRight: 8,
          background: 'linear-gradient(135deg, #818cf8, #c084fc)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          Finance Tracker
        </span>
        <NavLink to="/dashboard" style={linkStyle}>Dashboard</NavLink>
        <NavLink to="/transactions" style={linkStyle}>Transactions</NavLink>
        <NavLink to="/categories" style={linkStyle}>Categories</NavLink>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: 'var(--text-muted)', fontSize: 14, fontWeight: 500 }}>{user?.name}</span>
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{
              ...glassButton,
              padding: '7px 12px',
              fontSize: 16,
              lineHeight: 1,
              minWidth: 40,
            }}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button
            onClick={logout}
            style={{ ...glassButton, padding: '7px 16px', fontSize: 14 }}
          >
            Logout
          </button>
        </div>
      </nav>
      <main style={{ maxWidth: 1080, margin: '32px auto', padding: '0 20px' }}>
        {children}
      </main>
    </>
  );
}
