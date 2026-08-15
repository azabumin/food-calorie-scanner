import AsyncStorage from '@react-native-async-storage/async-storage';

import { WORKER_URL } from '../constants/config';

const AUTH_TOKEN_KEY = 'diet:authToken';

export type AuthErrorCode =
  | 'invalid_input'
  | 'email_taken'
  | 'invalid_credentials'
  | 'rate_limited'
  | 'network'
  | 'unknown';

export class AuthError extends Error {
  constructor(public code: AuthErrorCode) {
    super(code);
    this.name = 'AuthError';
  }
}

export type AuthUser = {
  email: string;
  createdAt: string;
  isPremium: boolean;
};

export type AuthResult = AuthUser & { token: string };

function errorCodeFromBody(body: unknown): AuthErrorCode {
  const code = body && typeof body === 'object' ? (body as { error?: unknown }).error : undefined;
  if (
    code === 'invalid_input' ||
    code === 'email_taken' ||
    code === 'invalid_credentials' ||
    code === 'rate_limited'
  ) {
    return code;
  }
  return 'unknown';
}

async function postAuth(path: 'register' | 'login', email: string, password: string): Promise<AuthResult> {
  let response: Response;
  try {
    response = await fetch(`${WORKER_URL}/auth/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    throw new AuthError('network');
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new AuthError('unknown');
  }

  if (!response.ok) {
    throw new AuthError(errorCodeFromBody(body));
  }

  const data = body as { token: string; email: string; createdAt: string; isPremium: boolean };
  return data;
}

export async function register(email: string, password: string): Promise<AuthResult> {
  return postAuth('register', email, password);
}

export async function login(email: string, password: string): Promise<AuthResult> {
  return postAuth('login', email, password);
}

// Never throws — an expired/invalid token should silently fall back to the
// device-based guest experience rather than blocking the app on an error.
export async function fetchMe(token: string): Promise<AuthUser | null> {
  try {
    const response = await fetch(`${WORKER_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return null;
    const data = (await response.json()) as AuthUser;
    return data;
  } catch {
    return null;
  }
}

export async function saveAuthToken(token: string): Promise<void> {
  await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
}

export async function loadAuthToken(): Promise<string | null> {
  return AsyncStorage.getItem(AUTH_TOKEN_KEY);
}

export async function clearAuthToken(): Promise<void> {
  await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
}
