import { config } from '../config';
import { MemoryRepository } from './memory';
import { seedMemory } from './seed';
import { SupabaseRepository } from './supabase';
import type { Repository } from './types';

let cached: Promise<Repository> | null = null;

/** Supabase bila env tersedia; jika tidak (hanya non-production) pakai memori + data demo. */
export function getRepository(): Promise<Repository> {
  if (cached) return cached;
  cached = (async () => {
    if (config.supabaseUrl && config.supabaseServiceKey) {
      return new SupabaseRepository(config.supabaseUrl, config.supabaseServiceKey);
    }
    if (config.isProd) {
      throw new Error('SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib diisi di production.');
    }
    console.warn('[api] Supabase belum dikonfigurasi -> memakai penyimpanan MEMORI + data demo (hilang saat restart).');
    const repo = new MemoryRepository();
    await seedMemory(repo);
    return repo;
  })();
  return cached;
}
