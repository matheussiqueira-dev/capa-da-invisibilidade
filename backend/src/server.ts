import { buildApp } from './app.js';
import { config } from './config.js';

const app = buildApp();

const start = async () => {
  try {
    await app.listen({ port: config.port, host: config.host });
    app.log.info(`Backend running on http://${config.host}:${config.port}`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

start();

const shutdown = async () => {
  try {
    await app.close();
    process.exit(0);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
