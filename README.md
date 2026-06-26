# SnipeIT Fast UX

A lightweight web application for quickly adding assets to a [Snipe-IT](https://snipeitapp.com/) inventory management instance. It provides a streamlined interface on top of the Snipe-IT API, authenticated via OAuth2.

## Prerequisites

- A running **Snipe-IT** instance with an OAuth2 application configured

## Quick Start with Docker

A production Docker image is published to Docker Hub at [`pixlcrashr/snipeit-fast-ux`](https://hub.docker.com/r/pixlcrashr/snipeit-fast-ux). It is a lightweight Node.js 22 Alpine image (multi-stage build) that serves the Astro SSR app via Fastify on port `4321`.

Tags:

- `pixlcrashr/snipeit-fast-ux:latest` — latest release
- `pixlcrashr/snipeit-fast-ux:X.Y.Z` — specific version (matching the Git tag `vX.Y.Z`)

Pull and run with Docker:

```bash
docker pull pixlcrashr/snipeit-fast-ux:latest
docker run -d \
  --name snipeit-fast-ux \
  -p 4321:4321 \
  -e SNIPEIT_API_URL=https://snipeit.example.com/api/v1 \
  -e SNIPEIT_OAUTH_CLIENT_ID=your-client-id \
  -e SNIPEIT_OAUTH_CLIENT_SECRET=your-client-secret \
  -e PUBLIC_URL=http://localhost:4321 \
  -e SESSION_SECRET=your-session-secret \
  pixlcrashr/snipeit-fast-ux:latest
```

### Docker Compose

Build and start the container:

```bash
docker compose up -d --build
```

The app will be exposed on port `4321`. Make sure your `.env` file is present in the project root before starting.

## Configuration

All configuration is done via environment variables:

| Variable | Description |
| :--- | :--- |
| `SNIPEIT_API_URL` | Base URL of your Snipe-IT API, e.g. `https://snipeit.example.com/api/v1` |
| `SNIPEIT_OAUTH_CLIENT_ID` | OAuth2 client ID from your Snipe-IT OAuth application |
| `SNIPEIT_OAUTH_CLIENT_SECRET` | OAuth2 client secret from your Snipe-IT OAuth application |
| `PUBLIC_URL` | The public-facing URL of this app, used to build the OAuth2 redirect URI, e.g. `http://localhost:4321` |
| `SESSION_SECRET` | A long, random secret used to sign session cookies |

## API Routes

All Snipe-IT API calls are proxied through the application server to avoid exposing credentials to the browser.

| Route | Description |
| :--- | :--- |
| `GET /api/auth/login` | Initiates the OAuth2 authorization flow |
| `GET /api/auth/callback` | OAuth2 redirect callback; exchanges code for token |
| `GET /api/auth/logout` | Clears the session and logs the user out |

## License

This project is licensed under the [GNU General Public License v3.0](LICENSE).

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

### Commands

| Command | Action |
| :--- | :--- |
| `npm install` | Install dependencies |
| `npm run dev` | Start local dev server at `http://localhost:4321` |
| `npm run build` | Build for production into `./dist/` |
| `npm run preview` | Preview the production build locally |
