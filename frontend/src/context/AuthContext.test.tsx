import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from './AuthContext';
import { authApi } from '../api/auth';
import type { User } from '../types';

vi.mock('../api/auth', () => ({
  authApi: {
    register: vi.fn(),
    login: vi.fn(),
    me: vi.fn(),
  },
}));

const mockAuthApi = vi.mocked(authApi);

const user: User = { id: 'u1', email: 'alice@example.com', name: 'Alice', createdAt: '2026-01-01' };

function TestConsumer() {
  const { user: currentUser, loading, login, register, logout } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="user-email">{currentUser?.email ?? 'none'}</span>
      <button onClick={() => login('alice@example.com', 'password123')}>login</button>
      <button onClick={() => register('Alice', 'alice@example.com', 'password123')}>register</button>
      <button onClick={logout}>logout</button>
    </div>
  );
}

function renderWithProvider() {
  return render(
    <AuthProvider>
      <TestConsumer />
    </AuthProvider>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('starts with loading=false and no user when there is no stored token', async () => {
    renderWithProvider();

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
    expect(screen.getByTestId('user-email')).toHaveTextContent('none');
    expect(mockAuthApi.me).not.toHaveBeenCalled();
  });

  it('fetches the current user when a token is already stored', async () => {
    localStorage.setItem('token', 'existing-token');
    mockAuthApi.me.mockResolvedValue({ data: { user } } as never);

    renderWithProvider();

    await waitFor(() => expect(screen.getByTestId('user-email')).toHaveTextContent('alice@example.com'));
  });

  it('removes an invalid stored token when /auth/me fails', async () => {
    localStorage.setItem('token', 'invalid-token');
    mockAuthApi.me.mockRejectedValue(new Error('unauthorized'));

    renderWithProvider();

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
    expect(localStorage.getItem('token')).toBeNull();
    expect(screen.getByTestId('user-email')).toHaveTextContent('none');
  });

  it('login stores the token and sets the user', async () => {
    mockAuthApi.login.mockResolvedValue({ data: { token: 'jwt-token', user } } as never);
    renderWithProvider();
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));

    await userEvent.setup().click(screen.getByText('login'));

    await waitFor(() => expect(screen.getByTestId('user-email')).toHaveTextContent('alice@example.com'));
    expect(localStorage.getItem('token')).toBe('jwt-token');
  });

  it('register stores the token and sets the user', async () => {
    mockAuthApi.register.mockResolvedValue({ data: { token: 'jwt-token', user } } as never);
    renderWithProvider();
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));

    await userEvent.setup().click(screen.getByText('register'));

    await waitFor(() => expect(screen.getByTestId('user-email')).toHaveTextContent('alice@example.com'));
    expect(localStorage.getItem('token')).toBe('jwt-token');
  });

  it('logout clears the token and the user', async () => {
    mockAuthApi.login.mockResolvedValue({ data: { token: 'jwt-token', user } } as never);
    renderWithProvider();
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
    const userEventInstance = userEvent.setup();
    await userEventInstance.click(screen.getByText('login'));
    await waitFor(() => expect(screen.getByTestId('user-email')).toHaveTextContent('alice@example.com'));

    await userEventInstance.click(screen.getByText('logout'));

    expect(screen.getByTestId('user-email')).toHaveTextContent('none');
    expect(localStorage.getItem('token')).toBeNull();
  });
});
