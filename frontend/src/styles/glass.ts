import type { CSSProperties } from 'react';

export const glassCard: CSSProperties = {
  background: 'var(--card-bg)',
  border: '1px solid var(--card-border)',
  boxShadow: 'var(--card-shadow)',
  borderRadius: 16,
};

export const glassCardSubtle: CSSProperties = {
  background: 'var(--card-bg-subtle)',
  border: '1px solid var(--card-border)',
  boxShadow: 'var(--card-shadow)',
  borderRadius: 12,
};

export const glassNav: CSSProperties = {
  background: 'var(--nav-bg)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  borderBottom: '1px solid var(--nav-border)',
};

export const glassInput: CSSProperties = {
  background: 'var(--input-bg)',
  border: '1px solid var(--input-border)',
  borderRadius: 8,
  color: 'var(--text-primary)',
};

export const glassButton: CSSProperties = {
  background: 'var(--button-bg)',
  border: '1px solid var(--button-border)',
  borderRadius: 8,
  color: 'var(--text-primary)',
  cursor: 'pointer',
};

export const primaryButton: CSSProperties = {
  background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
  border: 'none',
  borderRadius: 8,
  color: '#fff',
  fontWeight: 600,
  boxShadow: '0 4px 16px rgba(99, 102, 241, 0.35)',
  cursor: 'pointer',
};

export const dangerButton: CSSProperties = {
  background: 'var(--danger-bg)',
  border: '1px solid var(--danger-border)',
  borderRadius: 8,
  color: 'var(--danger-color)',
  cursor: 'pointer',
};
