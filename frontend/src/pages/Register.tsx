import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { glassCard, glassInput, primaryButton } from '../styles/glass';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(name, email, password);
      navigate('/dashboard');
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setError((err as any)?.response?.data?.error ?? 'Registration failed');
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

  const labelStyle = {
    display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500, color: '#374151',
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
          Create Account
        </h1>
        <p style={{ margin: '0 0 28px', color: '#6b7280', fontSize: 14 }}>
          Start tracking your finances today
        </p>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required style={inputStyle} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} />
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              minLength={8} required style={inputStyle} />
          </div>
          {error && <p style={{ color: '#dc2626', marginBottom: 12, fontSize: 13 }}>{error}</p>}
          <button type="submit" disabled={loading} style={{
            ...primaryButton, width: '100%', padding: '12px', fontSize: 15,
            opacity: loading ? 0.7 : 1,
          }}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>
        <p style={{ marginTop: 20, fontSize: 14, color: '#6b7280', textAlign: 'center' }}>
          Already have an account? <Link to="/login" style={{ color: '#818cf8', fontWeight: 500, textDecoration: 'none' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
