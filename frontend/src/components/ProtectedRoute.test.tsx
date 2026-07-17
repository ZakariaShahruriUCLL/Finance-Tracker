import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import type { User } from '../types';

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const mockUseAuth = vi.mocked(useAuth);

function renderProtectedRoute() {
  render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route path="/dashboard" element={<ProtectedRoute><div>Secret content</div></ProtectedRoute>} />
        <Route path="/login" element={<div>Login page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  it('shows a loading state while auth status is being resolved', () => {
    mockUseAuth.mockReturnValue({
      user: null, loading: true, login: vi.fn(), register: vi.fn(), logout: vi.fn(),
    });

    renderProtectedRoute();

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('redirects to /login when there is no authenticated user', () => {
    mockUseAuth.mockReturnValue({
      user: null, loading: false, login: vi.fn(), register: vi.fn(), logout: vi.fn(),
    });

    renderProtectedRoute();

    expect(screen.getByText('Login page')).toBeInTheDocument();
  });

  it('renders children when a user is authenticated', () => {
    const user: User = { id: 'u1', email: 'alice@example.com', name: 'Alice', createdAt: '2026-01-01' };
    mockUseAuth.mockReturnValue({
      user, loading: false, login: vi.fn(), register: vi.fn(), logout: vi.fn(),
    });

    renderProtectedRoute();

    expect(screen.getByText('Secret content')).toBeInTheDocument();
  });
});
