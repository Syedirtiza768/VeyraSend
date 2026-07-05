import type { NestExpressApplication } from '@nestjs/platform-express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import Redis from 'ioredis';
import type { AppConfig } from '@veyrasend/config';

// connect-redis v8 has awkward ESM/CJS interop; resolve defensively.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ConnectRedis = require('connect-redis') as {
  RedisStore?: new (opts: { client: unknown; prefix: string }) => session.Store;
  default?: new (opts: { client: unknown; prefix: string }) => session.Store;
};
const RedisStore = ConnectRedis.RedisStore ?? ConnectRedis.default ?? (ConnectRedis as unknown as new (opts: {
  client: unknown;
  prefix: string;
}) => session.Store);

/**
 * Applies cookie-parser, CORS, and the Redis-backed session middleware. Shared
 * by main.ts and the test suite so the session behaves identically in both.
 * Must be called before app.init()/listen().
 */
export function applyHttpMiddleware(app: NestExpressApplication, config: AppConfig): Redis {
  app.set('trust proxy', 1);
  app.enableCors({
    origin: [`http://localhost:${config.webPort}`, 'http://localhost:3040'],
    credentials: true,
  });
  app.use(cookieParser());

  // Capture the raw request body so signed event webhooks can be verified
  // against the exact bytes SendGrid sent (ADR: webhook verification).
  app.useBodyParser('json', {
    verify: (req: unknown, _res: unknown, buf: Buffer) => {
      (req as { rawBody?: Buffer }).rawBody = buf;
    },
  });
  // Inbound Parse posts form-encoded fields (from/to/subject/text/html) when
  // configured without multipart attachments; enable urlencoded parsing.
  app.useBodyParser('urlencoded', { extended: true });

  const redisClient = new Redis(config.redisUrl, {
    connectTimeout: 5000,
    maxRetriesPerRequest: null,
    lazyConnect: false,
  });

  const isProd = config.nodeEnv === 'production';
  app.use(
    session({
      name: 'veyrasend.sid',
      store: new RedisStore({ client: redisClient, prefix: 'veyrasend:sess:' }),
      secret: config.sessionSecret,
      resave: false,
      saveUninitialized: false,
      rolling: true,
      cookie: {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24 * 7,
        path: '/',
      },
    }),
  );
  return redisClient;
}
