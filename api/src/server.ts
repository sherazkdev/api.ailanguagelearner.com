import { buildApp } from './app.js';
import { connectMongo } from './config/db.js';
import { env } from './config/env.js';

async function main() {
  await connectMongo();
  const app = await buildApp();
  await app.listen({ port: env.PORT, host: env.HOST });
  app.log.info(`API http://${env.HOST}:${env.PORT}`);
  app.log.info(`Swagger http://127.0.0.1:${env.PORT}/docs`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
