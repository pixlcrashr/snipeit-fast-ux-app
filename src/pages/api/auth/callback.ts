import type { APIRoute } from 'astro';
import { exchangeCodeForToken, createSession, setSessionCookie, getRedirectUri } from '../../../lib/auth';

export const GET: APIRoute = async ({ url }) => {
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error) {
    return new Response(`Auth error: ${error}`, { status: 400 });
  }

  if (!code) {
    return new Response('Missing code', { status: 400 });
  }

  try {
    const data = await exchangeCodeForToken(code, getRedirectUri());
    const { access_token, expires_in } = data;

    const sessionToken = await createSession(access_token, expires_in);
    
    // Set cookie using the header
    return new Response(null, {
      status: 302,
      headers: {
        'Location': '/',
        'Set-Cookie': setSessionCookie(sessionToken, expires_in),
      },
    });
  } catch (e: any) {
    console.error('Auth error:', e);
    return new Response(`Authentication failed: ${e.message}`, { status: 500 });
  }
};
