import { FastifyInstance } from 'fastify';
import { generateVisualizationController } from '../controllers/visualization.controller.js';
import { getCatalogueController } from '../controllers/catalogue.controller.js';

export async function registerRoutes(fastify: FastifyInstance) {
  fastify.get('/health', async () => {
    return { status: 'ok' };
  });

  // V6.0: Catalogue endpoint
  fastify.get('/api/catalogue', getCatalogueController);

  // Visualization endpoint
  fastify.post('/generate-visualization', generateVisualizationController);
}
