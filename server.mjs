import fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import middie from '@fastify/middie';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { handler as render } from './dist/server/entry.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = fastify({ logger: true });

async function start() {
  // Register middie to support Node.js middleware
  await app.register(middie);

  // Serve static files from the client directory
  // These should be served before the Astro middleware
  await app.register(fastifyStatic, {
    root: join(__dirname, './dist/client'),
    prefix: '/_astro', // Astro assets are usually here
    decorateReply: false,
  });

  // Also serve other public files
  await app.register(fastifyStatic, {
    root: join(__dirname, './dist/client'),
    prefix: '/',
    wildcard: false,
    index: false,
  });

  // Use the Astro handler as a middleware for all other routes
  app.use((req, res, next) => {
    // Basic check to skip middleware for already handled requests or specific paths
    if (res.writableEnded) {
      return next();
    }
    render(req, res, next);
  });

  const port = process.env.PORT || 4321;
  const host = process.env.HOST || '0.0.0.0';

  try {
    await app.listen({ port: Number(port), host });
    console.log(`Server listening on http://${host}:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
