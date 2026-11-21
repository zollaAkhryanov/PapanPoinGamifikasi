import type { NextFunction, Request, RequestHandler, Response } from 'express';
import jwt from 'jsonwebtoken';
import type { UserRole } from '../../src/types';
import { config } from '../config';
import { forbidden, unauthorized } from '../lib/errors';
import type { Repository, UserRow } from '../repositories/types';

declare module 'express-serve-static-core' {
  interface Request {
    auth?: UserRow;
  }
}

export const signToken = (user: UserRow) =>
  jwt.sign({ sub: user.id, role: user.role }, config.jwtSecret, {
    algorithm: 'HS256',
    expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn'],
  });

export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };

/** Verifikasi JWT lalu muat ulang user dari DB agar perubahan role/penghapusan akun langsung berlaku. */
export const requireAuth = (repo: Repository): RequestHandler =>
  asyncHandler(async (req, _res, next) => {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) throw unauthorized('Token autentikasi tidak ditemukan.');
    let sub: string;
    try {
      const payload = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] }) as jwt.JwtPayload;
      sub = String(payload.sub);
    } catch {
      throw unauthorized('Sesi berakhir atau token tidak valid. Silakan masuk kembali.', 'INVALID_TOKEN');
    }
    const user = await repo.getUserById(sub);
    if (!user) throw unauthorized('Akun tidak ditemukan.', 'INVALID_TOKEN');
    req.auth = user;
    next();
  });

export const requireRole =
  (...roles: UserRole[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.auth || !roles.includes(req.auth.role)) {
      return next(forbidden('Fitur ini hanya dapat diakses oleh mentor.'));
    }
    next();
  };
