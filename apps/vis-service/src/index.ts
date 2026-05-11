import { loadEnvFile } from 'node:process';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { registerRoutes } from './routes/index.js';

// Load environment variables from .env
if (!process.env.K_SERVICE) {
  loadEnvFile();
}

const PORT = Number(process.env.PORT) || 8080;

// Create Fastify instance
const fastify = Fastify({
  trustProxy: true,
  logger: {
    level: process.env.NODE_ENV === 'development' ? 'info' : 'warn',
  },
});

// Register plugins
await fastify.register(cors, {
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Contractor-Id'],
});

await fastify.register(multipart, {
  limits: {
    fieldNameSize: 100,
    fieldSize: 1024 * 1024,
    fields: 20,
    fileSize: 10 * 1024 * 1024,
    files: 15,
    headerPairs: 2000,
    parts: 30,
  },
});

// Register application routes
await fastify.register(registerRoutes);

const start = async () => {
  try {
    const IS_GOOGLE_CLOUD_RUN = process.env.K_SERVICE !== undefined;
    const host = IS_GOOGLE_CLOUD_RUN ? "0.0.0.0" : undefined;

    await fastify.listen({ port: PORT, host });
    console.log(`🚀 Visualization Service running at http://${host || 'localhost'}:${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
