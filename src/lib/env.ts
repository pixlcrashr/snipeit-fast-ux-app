import {
  cleanEnv,
  str,
  bool,
} from 'envalid';

const env = cleanEnv(
  { ...import.meta.env, ...process.env } as Record<string, string | undefined>,
  {
    SNIPEIT_OAUTH_TOKEN_URL: str(),
    SNIPEIT_OAUTH_AUTHORIZE_URL: str(),
    SNIPEIT_API_URL: str(),
    SNIPEIT_OAUTH_CLIENT_ID: str(),
    SNIPEIT_OAUTH_CLIENT_SECRET: str(),
    PUBLIC_URL: str({ default: 'http://localhost:4321' }),
    SESSION_SECRET: str({ default: 'fallback-secret-at-least-32-chars-long' }),
    COOKIE_SAMESITE: str({ choices: ['strict', 'lax', 'none'], default: 'lax' }),
    COOKIE_SECURE: bool({ default: undefined }),
    COOKIE_HTTPONLY: bool({ default: true }),
  }
);

export default env;
