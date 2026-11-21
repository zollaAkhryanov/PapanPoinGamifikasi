/** Semua konfigurasi dibaca lazily agar mudah diuji (env bisa diubah antar tes). */
export const config = {
  get isProd() {
    return process.env.NODE_ENV === 'production';
  },
  get jwtSecret(): string {
    const s = process.env.JWT_SECRET;
    if (s && s.length >= 16) return s;
    if (this.isProd) throw new Error('JWT_SECRET wajib diisi (min. 16 karakter) di production.');
    return 'dev-only-insecure-secret-change-me';
  },
  get jwtExpiresIn(): string {
    return process.env.JWT_EXPIRES_IN || '12h';
  },
  get bcryptRounds(): number {
    return Number(process.env.BCRYPT_ROUNDS) || 10;
  },
  get supabaseUrl(): string {
    return process.env.SUPABASE_URL?.trim() || '';
  },
  get supabaseServiceKey(): string {
    return process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || '';
  },
  get defaultParticipantPassword(): string {
    return process.env.DEFAULT_PARTICIPANT_PASSWORD || 'peserta123';
  },
  get corsOrigins(): string[] {
    return (process.env.CORS_ORIGINS || 'http://localhost:3000')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  },
};
