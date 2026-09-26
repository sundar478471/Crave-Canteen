import { createApp } from './app';
import { config } from './config/env';

export async function startServer() {
  const app = await createApp();
  app.listen(config.port, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${config.port}`);
  });
}

if (process.argv[1] && process.argv[1].endsWith('server.ts')) {
  startServer();
}
