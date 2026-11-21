export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code: string = 'ERROR',
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export const unauthorized = (msg = 'Sesi tidak valid. Silakan masuk kembali.', code = 'UNAUTHORIZED') =>
  new HttpError(401, msg, code);
export const forbidden = (msg = 'Anda tidak memiliki akses ke sumber daya ini.') =>
  new HttpError(403, msg, 'FORBIDDEN');
export const notFound = (msg = 'Data tidak ditemukan.') => new HttpError(404, msg, 'NOT_FOUND');
export const conflict = (msg: string, code = 'CONFLICT') => new HttpError(409, msg, code);
export const invalid = (msg: string, details?: unknown) =>
  new HttpError(422, msg, 'VALIDATION_ERROR', details);
