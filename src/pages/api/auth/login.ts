import type { APIRoute } from 'astro';
import { getAuthUrl, getRedirectUri } from '../../../lib/auth';

export const GET: APIRoute = async () => {
  return new Response(null, {
    status: 302,
    headers: {
      Location: getAuthUrl(getRedirectUri()),
    },
  });
};
