import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import helmet from 'helmet';
import { config } from './config';
import { HttpError } from './lib/errors';
import { createApiRouter } from './routes';
import { getRepository } from './repositories';
import type { Repository } from './repositories/types';

export function createApp(repoOrPromise?: Repository | Promise<Repository>) {
  const app = express();
  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: config.corsOrigins, credentials: false }));
  app.use(express.json({ limit: '100kb' }));

  // Repo dibuat lazily agar cold-start serverless & error konfigurasi tertangani rapi.
  const repoPromise = repoOrPromise ? Promise.resolve(repoOrPromise) : null;
  let router: ReturnType<typeof createApiRouter> | null = null;
  app.use('/api', async (req, res, next) => {
    try {
      if (!router) router = createApiRouter(await (repoPromise ?? getRepository()));
      router(req, res, next);
    } catch (err) {
      next(err);
    }
  });

  app.use((_req, _res, next) => next(new HttpError(404, 'Endpoint tidak ditemukan.', 'NOT_FOUND')));

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof HttpError) {
      return void res.status(err.status).json({ message: err.message, code: err.code, errors: err.details });
    }
    if (err instanceof SyntaxError && 'body' in err) {
      return void res.status(400).json({ message: 'Format JSON tidak valid.', code: 'BAD_JSON' });
    }
    console.error('[api] error tak terduga:', err);
    res.status(500).json({ message: 'Terjadi kesalahan pada server.', code: 'INTERNAL_ERROR' });
  });

  return app;
}

export default createApp();
