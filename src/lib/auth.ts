import { SignJWT, jwtVerify } from 'jose';
import { parse, serialize } from 'cookie';
import type { APIContext } from 'astro';

const getEnv = (key: string) => {
  return import.meta.env[key] || (typeof process !== 'undefined' ? process.env[key] : undefined) || '';
};

const SECRET = new TextEncoder().encode(
  getEnv('SESSION_SECRET') || 'fallback-secret-at-least-32-chars-long'
);

export interface Session {
  accessToken: string;
  expiresAt: number;
}

export async function createSession(accessToken: string, expiresIn: number): Promise<string> {
  const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;
  return await new SignJWT({ accessToken, expiresAt })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${expiresIn}s`)
    .sign(SECRET);
}

export async function getSession(request: Request): Promise<Session | null> {
  const cookies = parse(request.headers.get('cookie') || '');
  const token = cookies.session;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as Session;
  } catch (e) {
    return null;
  }
}

export function setSessionCookie(token: string, expiresIn: number) {
  return serialize('session', token, {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'lax',
    path: '/',
    maxAge: expiresIn,
  });
}

export function clearSessionCookie() {
  return serialize('session', '', {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

export function getPublicBaseUrl(): string {
  return getEnv('PUBLIC_URL') || 'http://localhost:4321';
}

export function getRedirectUri(): string {
  return `${getPublicBaseUrl()}/api/auth/callback`;
}

export async function exchangeCodeForToken(code: string, redirectUri: string) {
  const apiUri = getEnv('SNIPEIT_API_URL');
  if (!apiUri) throw new Error('SNIPEIT_API_URL not configured');

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: getEnv('SNIPEIT_OAUTH_CLIENT_ID'),
    client_secret: getEnv('SNIPEIT_OAUTH_CLIENT_SECRET'),
    redirect_uri: redirectUri,
    code,
  });

  // SnipeIT OAuth token endpoint is usually at /oauth/token relative to the base URL
  const baseUrl = apiUri.replace(/\/api\/v1\/?$/, '');
  const response = await fetch(`${baseUrl}/oauth/token`, {
    method: 'POST',
    body: params,
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to exchange code: ${response.status} ${text}`);
  }

  return await response.json();
}

export function getAuthUrl(redirectUri: string) {
  const apiUri = getEnv('SNIPEIT_API_URL');
  if (!apiUri) throw new Error('SNIPEIT_API_URL not configured');

  const baseUrl = apiUri.replace(/\/api\/v1\/?$/, '');
  const params = new URLSearchParams({
    client_id: getEnv('SNIPEIT_OAUTH_CLIENT_ID'),
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: '', // SnipeIT doesn't use scopes extensively in this flow usually
  });

  return `${baseUrl}/oauth/authorize?${params.toString()}`;
}
