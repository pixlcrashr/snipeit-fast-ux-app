# SnipeIT Fast UX

A lightweight web application for quickly adding assets to a [Snipe-IT](https://snipeitapp.com/) inventory management instance. It provides a streamlined interface on top of the Snipe-IT API, authenticated via OAuth2.

## Prerequisites

- A running **Snipe-IT** instance with an OAuth2 application configured

## Quick Start

A production Docker image is published to Docker Hub at [`pixlcrashr/snipeit-fast-ux`](https://hub.docker.com/r/pixlcrashr/snipeit-fast-ux). It is a lightweight Node.js 22 Alpine image (multi-stage build) that serves the Astro SSR app via Fastify on port `4321`.

Tags:

- `pixlcrashr/snipeit-fast-ux:latest` — latest release
- `pixlcrashr/snipeit-fast-ux:X.Y.Z` — specific version (matching the Git tag `vX.Y.Z`)

### Docker Compose

1. Copy `.env.example` to `.env` and fill in your values:
    ```bash
    cp .env.example .env
    ```

2. Start the container:

    ```bash
    docker compose up -d
    ```

    > **Tip:** Add `--build` to force a rebuild of the image even if it already exists locally. This is recommended to ensure you're running the latest version:
    > ```bash
    > docker compose up -d --build
    > ```

The app will be exposed on port `0.0.0.0:4321`.

## Configuration

All configuration is done via environment variables:

| Variable | Required | Description |
| :--- | :--- | :--- |
| `SNIPEIT_API_URL` | Yes | Base URL of your Snipe-IT API, usually `https://snipeit.example.com/api/v1` |
| `SNIPEIT_OAUTH_CLIENT_ID` | Yes | OAuth2 client ID from your Snipe-IT OAuth application |
| `SNIPEIT_OAUTH_CLIENT_SECRET` | Yes | OAuth2 client secret from your Snipe-IT OAuth application |
| `SNIPEIT_OAUTH_TOKEN_URL` | Yes | Full URL of the OAuth2 token endpoint, usually `https://snipeit.example.com/oauth/token` |
| `SNIPEIT_OAUTH_AUTHORIZE_URL` | Yes | Full URL of the OAuth2 authorize endpoint, usually `https://snipeit.example.com/oauth/authorize` |
| `PUBLIC_URL` | Yes | The public-facing URL of this app, used to build the OAuth2 redirect URI, e.g. `http://localhost:4321` |
| `SESSION_SECRET` | Yes | A long, random secret used to sign session cookies |
| `COOKIE_SAMESITE` | No | Cookie SameSite policy: `strict`, `lax`, or `none`. Default: `lax` |
| `COOKIE_SECURE` | No | Cookie Secure flag: `true` or `false`. Default: auto-detected from `PUBLIC_URL` protocol |
| `COOKIE_HTTPONLY` | No | Cookie HttpOnly flag: `true` or `false`. Default: `true` |

## Reverse Proxy (nginx)

To serve both Snipe-IT and this app on the same domain, for example, use a nginx reverse proxy. The following example serves Snipe-IT at `/` and this app at `/addins/snipeit-fast-ux`:

```nginx
server {
    listen 443 ssl;
    server_name snipeit.example.com;

    # SSL configuration (adjust to your setup)
    ssl_certificate     /etc/nginx/ssl/snipeit.crt;
    ssl_certificate_key /etc/nginx/ssl/snipeit.key;

    # Snipe-IT
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # SnipeIT Fast UX
    location /addins/snipeit-fast-ux/ {
        proxy_pass http://127.0.0.1:4321/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

When using a reverse proxy with a subpath, set `PUBLIC_URL` to the full public URL including the path:

```bash
PUBLIC_URL=https://snipeit.example.com/addins/snipeit-fast-ux
```

This results in the OAuth2 redirect URI `https://snipeit.example.com/addins/snipeit-fast-ux/api/auth/callback`. Register this exact URI in your Snipe-IT OAuth2 application's allowed redirect URIs.

## API Routes

| Route | Description |
| :--- | :--- |
| `GET /api/auth/login` | Initiates the OAuth2 authorization flow |
| `GET /api/auth/callback` | OAuth2 redirect callback; exchanges code for token |
| `GET /api/auth/logout` | Clears the session and logs the user out |

---

## Development

### Prerequisites

- **Node.js** >= 22.12.0

### Local development

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:4321`.

### Manual production build

```bash
npm run build
node server.mjs
```

## Road Map

- [x] Add ui for fast asset creation
- [ ] Add ui for fast component creation
- [ ] Add ui for fast checkin/checkout (scan asset, scan QR code / select user, done)
- [ ] Add ui for QR code creation for users
- [ ] Add ui for a slightly more advanced reservation system (i.e. scheduled future checkouts)
