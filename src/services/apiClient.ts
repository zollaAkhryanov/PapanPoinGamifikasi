import { API_CONFIG } from '../config/apiConfig';

export class ApiClientError extends Error {
  public readonly status: number;
  public readonly code?: string;

  constructor(message: string, status = 500, code?: string) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
  }
}

interface RequestOptions extends RequestInit {
  timeoutMs?: number;
  skipAuth?: boolean;
}

function getStoredToken(): string | null {
  try {
    return localStorage.getItem(API_CONFIG.storageTokenKey);
  } catch {
    return null;
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { timeoutMs = API_CONFIG.timeoutMs, skipAuth = false, headers, ...rest } = options;
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  const mergedHeaders = new Headers(headers);
  if (!mergedHeaders.has('Content-Type') && !(rest.body instanceof FormData)) {
    mergedHeaders.set('Content-Type', 'application/json');
  }
  mergedHeaders.set('Accept', 'application/json');

  if (!skipAuth) {
    const token = getStoredToken();
    if (token) {
      mergedHeaders.set('Authorization', `Bearer ${token}`);
    }
  }

  const baseUrl = API_CONFIG.baseUrl.replace(/\/+$/, '');
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${normalizedEndpoint}`;

  try {
    const response = await fetch(url, {
      ...rest,
      headers: mergedHeaders,
      signal: controller.signal,
    });

    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const payload = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const message =
        typeof payload === 'object' && payload !== null && 'message' in payload
          ? String((payload as { message: unknown }).message)
          : `Permintaan gagal dengan kode status ${response.status}.`;
      const code =
        typeof payload === 'object' && payload !== null && 'code' in payload
          ? String((payload as { code: unknown }).code)
          : undefined;
      throw new ApiClientError(message, response.status, code);
    }

    // Mendukung pola respons backend `{ data: ... }` maupun respons objek langsung
    if (
      typeof payload === 'object' &&
      payload !== null &&
      'data' in payload &&
      !('token' in payload)
    ) {
      return (payload as { data: T }).data;
    }

    return payload as T;
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiClientError(
        'Koneksi ke server melebihi batas waktu. Periksa jaringan Anda lalu coba lagi.',
        408,
        'REQUEST_TIMEOUT'
      );
    }
    throw new ApiClientError(
      'Tidak dapat terhubung ke server API. Pastikan layanan backend aktif.',
      0,
      'NETWORK_ERROR'
    );
  } finally {
    window.clearTimeout(timeoutId);
  }
}
