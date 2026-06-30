import {
  SignJWT,
  jwtVerify,
} from 'jose';
import {
  parse,
  serialize,
} from 'cookie';
import env from './env';

const SECRET = new TextEncoder().encode(env.SESSION_SECRET);

const getCookieSecure = (): boolean => {
  if (env.COOKIE_SECURE !== undefined) return env.COOKIE_SECURE;
  return env.PUBLIC_URL.startsWith('https://');
};

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
    httpOnly: env.COOKIE_HTTPONLY,
    secure: getCookieSecure(),
    sameSite: env.COOKIE_SAMESITE,
    path: '/',
    maxAge: expiresIn,
  });
}

export function clearSessionCookie() {
  return serialize('session', '', {
    httpOnly: env.COOKIE_HTTPONLY,
    secure: getCookieSecure(),
    sameSite: env.COOKIE_SAMESITE,
    path: '/',
    maxAge: 0,
  });
}

export function getPublicBaseUrl(): string {
  return env.PUBLIC_URL;
}

export function getRedirectUri(): string {
  return `${getPublicBaseUrl()}/api/auth/callback`;
}

export async function exchangeCodeForToken(code: string, redirectUri: string) {
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: env.SNIPEIT_OAUTH_CLIENT_ID,
    client_secret: env.SNIPEIT_OAUTH_CLIENT_SECRET,
    redirect_uri: redirectUri,
    code,
  });

  const response = await fetch(env.SNIPEIT_OAUTH_TOKEN_URL, {
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
  const params = new URLSearchParams({
    client_id: env.SNIPEIT_OAUTH_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: '', // SnipeIT doesn't use scopes extensively in this flow usually
  });

  return `${env.SNIPEIT_OAUTH_AUTHORIZE_URL}?${params.toString()}`;
}
