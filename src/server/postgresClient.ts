import { Client, ClientConfig } from 'pg';
import config from './config';

const postgresConfig: ClientConfig = {
  host: config.postgres.host,
  port: config.postgres.port,
  user: config.postgres.user,
  password: config.postgres.password,
  database: config.postgres.database,
  connectionTimeoutMillis: 5000, // Timeout for initial connection
};

const pgClient = new Client(postgresConfig);

// This function will perform a simple query to check the connection.
export async function checkPostgresConnection() {
  try {
    await pgClient.connect();
    console.log('[Postgres] Client connected successfully.');
    // Perform a simple query to ensure the connection is truly active
    const res = await pgClient.query('SELECT NOW()');
    console.log('[Postgres] Connection check successful. Server time:', res.rows[0].now);
  } catch (err: unknown) {
    console.error('[Postgres] Failed to connect or perform connection check:', err);
    // In a real-world scenario, you might want to exit the process
    // if the database is critical for the application's startup.
    // process.exit(1);
  }
}

// Export a function to be called for graceful shutdown
export const disconnectPostgres = async () => {
  console.log('[Postgres] Disconnecting client...');
  await pgClient.end();
  console.log('[Postgres] Client disconnected successfully.');
};

// Immediately check the connection when the module is loaded.
checkPostgresConnection();

export default pgClient; 