import { FastifyRequest, FastifyReply } from 'fastify';
import { getCatalogueRegistry } from '../data/catalogues.js';

export async function getCatalogueController(request: FastifyRequest, reply: FastifyReply) {
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
}
