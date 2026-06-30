import type {
  APIRoute,
} from 'astro';
import env from '../../../lib/env';

export const ALL: APIRoute = async ({ request, params }) => {
  if (!import.meta.env.DEV) {
    return new Response(null, { status: 404 });
  }

  const { path } = params;
  const API_URL = env.SNIPEIT_API_URL.replace(/\/$/, '');

  // Build the target URL (preserving query params)
  const url = new URL(request.url);
  const cleanPath = path?.startsWith('/') ? path.substring(1) : path;
  const targetUrl = `${API_URL}/${cleanPath}${url.search}`;

  // Clone headers and handle Authorization
  const headers = new Headers();
  const headersToKeep = ['authorization', 'accept', 'content-type'];
  for (const [key, value] of request.headers.entries()) {
    if (headersToKeep.includes(key.toLowerCase())) {
      headers.set(key, value);
    }
  }

  try {
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? await request.blob() : undefined,
      redirect: 'follow'
    });

    const body = await response.blob();
    return new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
      }
    });
  } catch (error: any) {
    console.error('Proxy error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
