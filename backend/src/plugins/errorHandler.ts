import type { FastifyPluginAsync } from 'fastify';

export const errorHandler: FastifyPluginAsync = async (app) => {
  app.setErrorHandler((error, request, reply) => {
    const err = error instanceof Error ? error : new Error('Unknown error');
    const statusCode = (error as { statusCode?: number }).statusCode ?? 500;
    const details = (error as { details?: unknown }).details;

    request.log.error({ err }, 'Request failed');

    reply.status(statusCode).send({
      error: statusCode >= 500 ? 'InternalServerError' : 'RequestError',
      message: statusCode >= 500 ? 'Internal server error' : err.message,
      details: statusCode >= 500 ? undefined : details
    });
  });
};
