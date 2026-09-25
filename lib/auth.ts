import AsyncStorage from '@react-native-async-storage/async-storage';

import { WORKER_URL } from '../constants/config';

const AUTH_TOKEN_KEY = 'diet:authToken';

export type AuthErrorCode =
  | 'invalid_input'
  | 'email_taken'
  | 'invalid_credentials'
  | 'rate_limited'
  | 'not_subscribed'
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
  cardRegistered: boolean;
  // Optional: absent on a response from a server that predates My Page.
  cancelAtPeriodEnd?: boolean;
  nextChargeDueAt?: string | null;
  premiumExpiresAt?: string | null;
};

export type AuthResult = AuthUser & { token: string };

function errorCodeFromBody(body: unknown): AuthErrorCode {
  const code = body && typeof body === 'object' ? (body as { error?: unknown }).error : undefined;
  if (
    code === 'invalid_input' ||
    code === 'email_taken' ||
    code === 'invalid_credentials' ||
    code === 'rate_limited' ||
    code === 'not_subscribed'
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

  const data = body as { token: string; email: string; createdAt: string; isPremium: boolean; cardRegistered: boolean };
  return data;
}

export async function register(email: string, password: string): Promise<AuthResult> {
  return postAuth('register', email, password);
}

export async function login(email: string, password: string): Promise<AuthResult> {
  return postAuth('login', email, password);
}

export type MeResult =
  | { status: 'ok'; user: AuthUser }
  | { status: 'invalid' } // the server rejected the token (expired or revoked)
  | { status: 'unavailable' }; // couldn't reach the server, or it errored -- says nothing about the token

// Never throws. When the server sends back a refreshed token (the current one is nearing expiry) it is
// stored here, so callers don't have to care.
export async function fetchMeResult(token: string): Promise<MeResult> {
  try {
    const response = await fetch(`${WORKER_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.status === 401) return { status: 'invalid' };
    if (!response.ok) return { status: 'unavailable' };
    const { token: refreshedToken, ...user } = (await response.json()) as AuthUser & { token?: string };
    if (refreshedToken) await saveAuthToken(refreshedToken);
    return { status: 'ok', user };
  } catch {
    return { status: 'unavailable' };
  }
}

// Convenience for screens that only need the user: null on any failure.
export async function fetchMe(token: string): Promise<AuthUser | null> {
  const result = await fetchMeResult(token);
  return result.status === 'ok' ? result.user : null;
}

export type SubscriptionChange = {
  cancelAtPeriodEnd: boolean;
  nextChargeDueAt: string | null;
  premiumExpiresAt: string | null;
};

async function accountAction(path: 'cancel' | 'resume', token: string): Promise<SubscriptionChange> {
  let response: Response;
  try {
    response = await fetch(`${WORKER_URL}/account/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: '{}',
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
  if (!response.ok) throw new AuthError(errorCodeFromBody(body));
  return body as SubscriptionChange;
}

// Stops the next renewal; premium keeps working until the period already paid for ends.
export const cancelSubscription = (token: string) => accountAction('cancel', token);
export const resumeSubscription = (token: string) => accountAction('resume', token);

export async function saveAuthToken(token: string): Promise<void> {
  await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
}

export async function loadAuthToken(): Promise<string | null> {
  return AsyncStorage.getItem(AUTH_TOKEN_KEY);
}

export async function clearAuthToken(): Promise<void> {
  await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
}
