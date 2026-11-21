import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';
import { invalid } from '../lib/errors';

export const validateBody =
  <T>(schema: ZodType<T>): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse(req.body ?? {});
    if (!result.success) {
      const errors = result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
      return next(invalid(errors[0]?.message ?? 'Data yang dikirim tidak valid.', errors));
    }
    req.body = result.data;
    next();
  };
