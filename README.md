# SnipeIT Fast UX

A lightweight web application for quickly adding assets to a [Snipe-IT](https://snipeitapp.com/) inventory management instance. It provides a streamlined interface on top of the Snipe-IT API, authenticated via OAuth2.

## Prerequisites

- **Node.js** >= 22.12.0
- A running **Snipe-IT** instance with an OAuth2 application configured

## Configuration

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

| Variable | Description |
| :--- | :--- |
| `SNIPEIT_API_URL` | Base URL of your Snipe-IT API, e.g. `https://snipeit.example.com/api/v1` |
| `SNIPEIT_OAUTH_CLIENT_ID` | OAuth2 client ID from your Snipe-IT OAuth application |
| `SNIPEIT_OAUTH_CLIENT_SECRET` | OAuth2 client secret from your Snipe-IT OAuth application |
| `SNIPEIT_OAUTH_REDIRECT_URI` | Redirect URI registered in your Snipe-IT OAuth application, e.g. `http://localhost:4321/api/auth/callback` |
| `SESSION_SECRET` | A long, random secret used to sign session cookies |

## Development

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:4321`.

## Production

### Docker Compose (recommended)

```bash
# Build and start the container
docker compose up -d
```

The app will be exposed on port `4321`. Make sure your `.env` file is present in the project root before starting.

### Manual build

```bash
npm run build
node server.mjs
```

## Commands

| Command | Action |
| :--- | :--- |
| `npm install` | Install dependencies |
| `npm run dev` | Start local dev server at `http://localhost:4321` |
| `npm run build` | Build for production into `./dist/` |
| `npm run preview` | Preview the production build locally |

## API Routes

All Snipe-IT API calls are proxied through the application server to avoid exposing credentials to the browser.

| Route | Description |
| :--- | :--- |
| `GET /api/auth/login` | Initiates the OAuth2 authorization flow |
| `GET /api/auth/callback` | OAuth2 redirect callback; exchanges code for token |
| `GET /api/auth/logout` | Clears the session and logs the user out |
| `* /api/proxy/[...path]` | Authenticated proxy to the Snipe-IT API |

## License

This project is licensed under the [GNU General Public License v3.0](LICENSE).
