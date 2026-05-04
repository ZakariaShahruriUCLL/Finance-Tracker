import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Wallet, Mail, Lock, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { glassCard, glassInput, primaryButton } from '../styles/glass';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setError((err as any)?.response?.data?.error ?? 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = { ...glassInput, width: '100%', padding: '11px 14px', fontSize: 14 };
  const labelStyle = { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7, fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.06em' };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ ...glassCard, padding: 40, width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 6px 20px rgba(99,102,241,0.45)',
          }}>
            <Wallet size={20} strokeWidth={1.75} color="#fff" />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 800, letterSpacing: '-0.03em',
              background: 'linear-gradient(135deg, #818cf8, #c084fc)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              FinFlow
            </p>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--text-faint)', fontWeight: 500 }}>Personal Finance Tracker</p>
          </div>
        </div>

        <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
          Welcome back
        </h1>
        <p style={{ margin: '0 0 24px', color: 'var(--text-muted)', fontSize: 13 }}>Sign in to continue</p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>
              <Mail size={11} strokeWidth={2.5} />Email
            </label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              required style={inputStyle} placeholder="you@example.com" />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>
              <Lock size={11} strokeWidth={2.5} />Password
            </label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              required style={inputStyle} placeholder="••••••••" />
          </div>
          {error && <p style={{ color: 'var(--color-expense)', marginBottom: 14, fontSize: 13 }}>{error}</p>}
          <button type="submit" disabled={loading} style={{
            ...primaryButton, width: '100%', padding: '12px', fontSize: 15,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            opacity: loading ? 0.7 : 1,
          }}>
            <LogIn size={17} strokeWidth={2} />
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
        <p style={{ marginTop: 20, fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
          No account?{' '}
          <Link to="/register" style={{ color: '#818cf8', fontWeight: 600 }}>Create one →</Link>
        </p>
      </div>
    </div>
  );
}
