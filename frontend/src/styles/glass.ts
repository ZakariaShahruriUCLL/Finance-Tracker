import type { CSSProperties } from 'react';

export const glassCard: CSSProperties = {
  background: 'var(--glass-bg)',
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  border: '1px solid var(--glass-border)',
  boxShadow: 'var(--glass-shadow)',
  borderRadius: 16,
};

export const glassCardSubtle: CSSProperties = {
  background: 'var(--glass-bg-subtle)',
  backdropFilter: 'blur(14px) saturate(160%)',
  WebkitBackdropFilter: 'blur(14px) saturate(160%)',
  border: '1px solid var(--glass-border)',
  boxShadow: 'var(--glass-shadow-subtle)',
  borderRadius: 12,
};

export const glassNav: CSSProperties = {
  background: 'var(--glass-nav-bg)',
  backdropFilter: 'blur(24px) saturate(180%)',
  WebkitBackdropFilter: 'blur(24px) saturate(180%)',
  borderBottom: '1px solid var(--glass-border)',
  boxShadow: 'var(--glass-nav-shadow)',
};

export const glassInput: CSSProperties = {
  background: 'var(--glass-input-bg)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  border: '1px solid var(--glass-border-strong)',
  borderRadius: 8,
  color: 'var(--text-primary)',
};

export const glassButton: CSSProperties = {
  background: 'var(--glass-button-bg)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  border: '1px solid var(--glass-border)',
  borderRadius: 8,
  color: 'var(--text-primary)',
  cursor: 'pointer',
};

export const primaryButton: CSSProperties = {
  background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
  border: 'none',
  borderRadius: 8,
  color: '#fff',
  fontWeight: 500,
  boxShadow: '0 4px 16px rgba(99, 102, 241, 0.35)',
  cursor: 'pointer',
};

export const dangerButton: CSSProperties = {
  background: 'var(--danger-bg)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  border: '1px solid var(--danger-border)',
  borderRadius: 8,
  color: 'var(--danger-color)',
  cursor: 'pointer',
};
