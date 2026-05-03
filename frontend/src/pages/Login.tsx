import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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

  const inputStyle = {
    ...glassInput,
    width: '100%',
    padding: '10px 14px',
    fontSize: 14,
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
    }}>
      <div style={{ ...glassCard, padding: 40, width: '100%', maxWidth: 420 }}>
        <h1 style={{
          margin: '0 0 8px', fontSize: 28, fontWeight: 700,
          background: 'linear-gradient(135deg, #6366f1, #a855f7)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          Welcome back
        </h1>
        <p style={{ margin: '0 0 28px', color: '#6b7280', fontSize: 14 }}>
          Sign in to your account
        </p>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500, color: '#374151' }}>
              Email
            </label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              required style={inputStyle} />
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500, color: '#374151' }}>
              Password
            </label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              required style={inputStyle} />
          </div>
          {error && <p style={{ color: '#dc2626', marginBottom: 12, fontSize: 13 }}>{error}</p>}
          <button type="submit" disabled={loading} style={{
            ...primaryButton, width: '100%', padding: '12px', fontSize: 15,
            opacity: loading ? 0.7 : 1,
          }}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
        <p style={{ marginTop: 20, fontSize: 14, color: '#6b7280', textAlign: 'center' }}>
          No account? <Link to="/register" style={{ color: '#818cf8', fontWeight: 500, textDecoration: 'none' }}>Register</Link>
        </p>
      </div>
    </div>
  );
}
