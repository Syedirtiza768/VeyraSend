import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ConfigService } from './config/config.service';
import { redactedConfig } from '@veyrasend/config';
import { applyHttpMiddleware } from './http-setup';

async function bootstrap(): Promise<void> {
  // Fail fast: ConfigService loads + validates env before the HTTP server starts.
  const config = new ConfigService();

  const logger = new Logger('bootstrap');
  logger.log(`Starting VeyraSend API — ${JSON.stringify(redactedConfig(config.all))}`);

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: false,
  });
  app.useLogger(logger);

  const redisClient = applyHttpMiddleware(app, config.all);
  redisClient.on('error', (err) => logger.error(`Redis session store error: ${err.message}`));

  app.setGlobalPrefix('api', { exclude: ['health', 'health/*'] });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.enableShutdownHooks();

  const port = config.all.apiPort;
  await app.listen(port);
  logger.log(`API listening on http://localhost:${port} (health: /health)`);
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start VeyraSend API:', err);
  process.exit(1);
});
