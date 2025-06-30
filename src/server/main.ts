import 'reflect-metadata';
import { Server } from './Server.js';

process.on('uncaughtException', (err, origin) => {
  console.error(`[Server] Uncaught Exception. Origin: ${origin}`, err);
  process.exit(1); // Exit on uncaught exceptions
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Server] Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1); // Exit on unhandled rejections
});

const server = new Server();

const gracefulShutdownHandler = (signal: string) => {
  console.log(`[Server] ${signal} received. Kicking off graceful shutdown.`);
  server.stop(signal).then((exitCode) => {
    console.log('[Server] Exiting process with code:', exitCode);
    process.exit(exitCode);
  });
};

process.on('SIGINT', () => gracefulShutdownHandler('SIGINT'));
process.on('SIGTERM', () => gracefulShutdownHandler('SIGTERM'));
process.on('SIGUSR2', () => gracefulShutdownHandler('SIGUSR2')); // Nodemon restart signal

server.start().catch((err) => {
  console.error('[Server] Failed to start server:', err);
  process.exit(1);
}); 