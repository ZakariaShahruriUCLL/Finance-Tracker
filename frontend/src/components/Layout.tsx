import { type ReactNode } from 'react';
import { NavLink, type NavLinkRenderProps } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 24,
  padding: '12px 24px',
  borderBottom: '1px solid #e5e7eb',
  background: '#fff',
  position: 'sticky',
  top: 0,
  zIndex: 10,
};

function linkStyle({ isActive }: NavLinkRenderProps): React.CSSProperties {
  return {
    textDecoration: 'none',
    color: isActive ? '#4f46e5' : '#374151',
    fontWeight: isActive ? 600 : 400,
    fontSize: 15,
  };
}

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <>
      <nav style={navStyle}>
        <span style={{ fontWeight: 700, fontSize: 18, color: '#111827', marginRight: 8 }}>
          Finance Tracker
        </span>
        <NavLink to="/dashboard" style={linkStyle}>Dashboard</NavLink>
        <NavLink to="/transactions" style={linkStyle}>Transactions</NavLink>
        <NavLink to="/categories" style={linkStyle}>Categories</NavLink>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: '#6b7280', fontSize: 14 }}>{user?.name}</span>
          <button
            onClick={logout}
            style={{ padding: '6px 14px', border: '1px solid #d1d5db', borderRadius: 6,
                     background: 'transparent', cursor: 'pointer', fontSize: 14 }}
          >
            Logout
          </button>
        </div>
      </nav>
      <main style={{ maxWidth: 960, margin: '32px auto', padding: '0 16px' }}>
        {children}
      </main>
    </>
  );
}
