import { timingSafeEqual } from 'crypto';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { config } from '../config.js';

const secureEqual = (left: string, right: string) => {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
};

const getApiKey = (header: string | string[] | undefined) => (Array.isArray(header) ? header[0] : header);

export const enforceApiKey = async (request: FastifyRequest, reply: FastifyReply) => {
  if (request.method === 'OPTIONS') return;

  const providedKey = getApiKey(request.headers['x-api-key']);
  if (!providedKey || !secureEqual(providedKey, config.apiKey)) {
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Invalid API key'
    });
  }
};
