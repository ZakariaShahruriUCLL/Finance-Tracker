import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { InternalAxiosRequestConfig } from 'axios';
import api from './client';

function getRequestFulfilledHandler() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handlers = (api.interceptors.request as any).handlers;
  return handlers[handlers.length - 1].fulfilled as (
    config: InternalAxiosRequestConfig
  ) => InternalAxiosRequestConfig;
}

function getResponseRejectedHandler() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handlers = (api.interceptors.response as any).handlers;
  return handlers[handlers.length - 1].rejected as (error: unknown) => Promise<never>;
}

describe('api client interceptors', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('attaches the Authorization header when a token is stored', () => {
    localStorage.setItem('token', 'jwt-token');
    const handler = getRequestFulfilledHandler();

    const config = handler({ headers: {} } as InternalAxiosRequestConfig);

    expect(config.headers.Authorization).toBe('Bearer jwt-token');
  });

  it('does not attach an Authorization header when there is no token', () => {
    const handler = getRequestFulfilledHandler();

    const config = handler({ headers: {} } as InternalAxiosRequestConfig);

    expect(config.headers.Authorization).toBeUndefined();
  });

  it('clears the token and redirects to /login on a 401 response', async () => {
    localStorage.setItem('token', 'jwt-token');
    const assign = vi.fn();
    vi.stubGlobal('location', { ...window.location, set href(value: string) { assign(value); }, get href() { return ''; } });
    const handler = getResponseRejectedHandler();

    await expect(handler({ response: { status: 401 } })).rejects.toBeDefined();

    expect(localStorage.getItem('token')).toBeNull();
    expect(assign).toHaveBeenCalledWith('/login');
  });

  it('leaves the token untouched for non-401 errors', async () => {
    localStorage.setItem('token', 'jwt-token');
    const handler = getResponseRejectedHandler();

    await expect(handler({ response: { status: 500 } })).rejects.toBeDefined();

    expect(localStorage.getItem('token')).toBe('jwt-token');
  });
});
