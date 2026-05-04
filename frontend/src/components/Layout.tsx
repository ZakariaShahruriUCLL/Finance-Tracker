import { type ReactNode } from 'react';
import { NavLink, type NavLinkRenderProps } from 'react-router-dom';
import { LayoutGrid, ArrowLeftRight, Tags, LogOut, Sun, Moon, Wallet } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { glassNav, glassButton } from '../styles/glass';

const navStyle: React.CSSProperties = {
  ...glassNav,
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  padding: '12px 28px',
  position: 'sticky',
  top: 0,
  zIndex: 10,
};

function linkStyle({ isActive }: NavLinkRenderProps): React.CSSProperties {
  return {
    textDecoration: 'none',
    display: 'flex', alignItems: 'center', gap: 7,
    color: isActive ? '#818cf8' : 'var(--text-muted)',
    fontWeight: isActive ? 600 : 500,
    fontSize: 14,
    padding: '7px 12px',
    borderRadius: 8,
    background: isActive ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
  };
}

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      <nav style={navStyle}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 16 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
            flexShrink: 0,
          }}>
            <Wallet size={16} color="#fff" strokeWidth={2} />
          </div>
          <span style={{
            fontWeight: 800, fontSize: 16, letterSpacing: '-0.03em',
            background: 'linear-gradient(135deg, #818cf8, #c084fc)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            FinFlow
          </span>
        </div>

        <NavLink to="/dashboard" style={linkStyle}>
          <LayoutGrid size={16} strokeWidth={1.75} />
          Dashboard
        </NavLink>
        <NavLink to="/transactions" style={linkStyle}>
          <ArrowLeftRight size={16} strokeWidth={1.75} />
          Transactions
        </NavLink>
        <NavLink to="/categories" style={linkStyle}>
          <Tags size={16} strokeWidth={1.75} />
          Categories
        </NavLink>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 500 }}>{user?.name}</span>
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{ ...glassButton, padding: '7px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {theme === 'dark'
              ? <Sun size={16} strokeWidth={1.75} color="var(--text-secondary)" />
              : <Moon size={16} strokeWidth={1.75} color="var(--text-secondary)" />}
          </button>
          <button onClick={logout} style={{ ...glassButton, padding: '7px 14px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            <LogOut size={14} strokeWidth={1.75} />
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
