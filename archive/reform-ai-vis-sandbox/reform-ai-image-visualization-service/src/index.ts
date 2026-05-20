import { loadEnvFile } from 'node:process';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { generateVisualizationController } from './controllers/main.js';
import { getCatalogueRegistry } from './data/catalogues.js';

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

// CORS plugin
await fastify.register(cors, {
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Contractor-Id'],
});

// Multipart plugin
await fastify.register(multipart, {
  limits: {
    fieldNameSize: 100, // Max field name size in bytes
    fieldSize: 1024 * 1024, // Max field value size in bytes (1MB)
    fields: 20, // Max number of non-file fields
    fileSize: 10 * 1024 * 1024, // Max file size (10MB)
    files: 15, // Max number of file fields
    headerPairs: 2000, // Max number of header key=>value pairs
    parts: 30, // Max number of parts (fields + files)
  },
});

fastify.get('/health', async () => {
  return { status: 'ok' };
});

// V6.0: Catalogue endpoint — returns active, visible items for a contractor
fastify.get('/api/catalogue', async (request, reply) => {
  const contractorId = request.headers['x-contractor-id'] as string | undefined;
  if (!contractorId || contractorId.trim() === '') {
    return reply.status(400).send({ error: 'X-Contractor-Id header is required' });
  }
  const registry = getCatalogueRegistry();
  const items = registry[contractorId.trim()];
  if (!items) {
    return reply.status(404).send({ error: `Contractor '${contractorId}' not found in catalogue registry` });
  }
  const visible = items.filter(i => i.active && i.contractorVisible);
  return { contractorId: contractorId.trim(), items: visible };
});

fastify.post('/generate-visualization', generateVisualizationController);

const start = async () => {
  try {
    const IS_GOOGLE_CLOUD_RUN = process.env.K_SERVICE !== undefined
    const host = IS_GOOGLE_CLOUD_RUN ? "0.0.0.0" : undefined

    await fastify.listen({ port: PORT, host });
    console.log(`🚀 Server running in http://${host}:${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
