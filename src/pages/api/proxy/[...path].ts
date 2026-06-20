import type { APIRoute } from 'astro';

export const ALL: APIRoute = async ({ request, params }) => {
  const { path } = params;
  const API_URL = (import.meta.env.SNIPEIT_API_URL || process.env.SNIPEIT_API_URL)?.replace(/\/$/, '');
  
  if (!API_URL) {
    return new Response('SNIPEIT_API_URL not configured', { status: 500 });
  }

  // Build the target URL (preserving query params)
  const url = new URL(request.url);
  const cleanPath = path?.startsWith('/') ? path.substring(1) : path;
  const targetUrl = `${API_URL}/${cleanPath}${url.search}`;

  console.log(`[Proxy] ${request.method} ${request.url} -> ${targetUrl}`);

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

    // Return the response as is
    const body = await response.blob();
    return new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
        'Access-Control-Allow-Origin': '*', // Optional, since this is server-to-server
      }
    });
  } catch (error: any) {
    console.error('Proxy error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
