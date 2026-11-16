import { Eye, EyeOff, Lock, LogIn, Mail } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { LoginPayload } from '../../types';
import { AlertBanner } from '../ui/AlertBanner';
import { Button } from '../ui/Button';

interface LoginFormProps {
  onSubmit: (payload: LoginPayload) => Promise<void>;
  isLoading: boolean;
  errorMessage: string | null;
  successMessage: string | null;
  onClearFeedback: () => void;
}

interface FieldErrors {
  identifier?: string;
  password?: string;
}

export function LoginForm({
  onSubmit,
  isLoading,
  errorMessage,
  successMessage,
  onClearFeedback,
}: LoginFormProps) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const validate = (): boolean => {
    const errors: FieldErrors = {};
    if (!identifier.trim()) {
      errors.identifier = 'Email atau username wajib diisi.';
    } else if (identifier.trim().length < 3) {
      errors.identifier = 'Email atau username minimal 3 karakter.';
    }

    if (!password) {
      errors.password = 'Kata sandi wajib diisi.';
    } else if (password.length < 6) {
      errors.password = 'Kata sandi minimal 6 karakter.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    onClearFeedback();
    if (!validate()) return;
    await onSubmit({ identifier: identifier.trim(), password });
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">
          Masuk ke Portal Akademi
        </h2>
        <p className="mt-1.5 text-sm text-slate-600">
          Gunakan email atau username terdaftar untuk mengakses progres belajar dan peringkat Anda.
        </p>
      </div>

      {errorMessage && (
        <AlertBanner
          variant="error"
          title="Gagal Masuk"
          description={errorMessage}
          onDismiss={onClearFeedback}
          className="mb-5"
        />
      )}

      {successMessage && (
        <AlertBanner
          variant="success"
          title="Berhasil Masuk"
          description={successMessage}
          className="mb-5"
        />
      )}

      <form onSubmit={handleFormSubmit} noValidate className="space-y-4">
        <div>
          <label
            htmlFor="login-identifier"
            className="mb-1.5 block text-sm font-medium text-slate-800"
          >
            Email atau Username
          </label>
          <div className="relative">
            <Mail
              className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              id="login-identifier"
              type="text"
              autoComplete="username"
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                if (fieldErrors.identifier) {
                  setFieldErrors((prev) => ({ ...prev, identifier: undefined }));
                }
              }}
              placeholder="nama@akademi.id atau username"
              aria-invalid={Boolean(fieldErrors.identifier)}
              aria-describedby={fieldErrors.identifier ? 'identifier-error' : undefined}
              className={`min-h-[44px] w-full rounded-lg border bg-white py-2.5 pr-3.5 pl-10 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                fieldErrors.identifier
                  ? 'border-red-400 focus:ring-red-500/30'
                  : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/20'
              }`}
            />
          </div>
          {fieldErrors.identifier && (
            <p id="identifier-error" className="mt-1.5 text-xs font-medium text-red-600">
              {fieldErrors.identifier}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="login-password"
            className="mb-1.5 block text-sm font-medium text-slate-800"
          >
            Kata Sandi
          </label>
          <div className="relative">
            <Lock
              className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) {
                  setFieldErrors((prev) => ({ ...prev, password: undefined }));
                }
              }}
              placeholder="Masukkan kata sandi"
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={fieldErrors.password ? 'password-error' : undefined}
              className={`min-h-[44px] w-full rounded-lg border bg-white py-2.5 pr-11 pl-10 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                fieldErrors.password
                  ? 'border-red-400 focus:ring-red-500/30'
                  : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/20'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
              className="absolute top-1/2 right-2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {fieldErrors.password && (
            <p id="password-error" className="mt-1.5 text-xs font-medium text-red-600">
              {fieldErrors.password}
            </p>
          )}
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isLoading}
          leftIcon={<LogIn className="h-4 w-4" />}
          className="w-full"
        >
          {isLoading ? 'Memverifikasi Akun...' : 'Masuk ke Akun'}
        </Button>
      </form>
    </div>
  );
}
