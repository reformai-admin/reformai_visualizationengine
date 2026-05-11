import { loadEnvFile } from 'node:process';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { generateVisualizationController } from './controllers/main.js';
import { getCatalogueRegistry } from './data/catalogues.js';

if (!process.env.K_SERVICE) {
    loadEnvFile();
}

const PORT = Number(process.env.PORT) || 8080;

const fastify = Fastify({
    trustProxy: true,
    logger: { level: process.env.NODE_ENV === 'development' ? 'info' : 'warn' },
});

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

fastify.get('/health', async () => ({ status: 'ok' }));

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
    return { contractorId: contractorId.trim(), items: items.filter(i => i.active && i.contractorVisible) };
});

fastify.post('/generate-visualization', generateVisualizationController);

const start = async () => {
    try {
        const host = process.env.K_SERVICE ? '0.0.0.0' : undefined;
        await fastify.listen({ port: PORT, host });
        console.log(`Server running on port ${PORT}`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
