import { AlertCircle, AlertTriangle, CheckCircle2, Info, RefreshCw, X } from 'lucide-react';
import { Button } from './Button';

interface AlertBannerProps {
  variant: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  onDismiss?: () => void;
  className?: string;
}

const STYLES: Record<
  AlertBannerProps['variant'],
  { container: string; iconColor: string; Icon: typeof Info }
> = {
  success: {
    container: 'border-emerald-200 bg-emerald-50 text-emerald-950',
    iconColor: 'text-emerald-700',
    Icon: CheckCircle2,
  },
  error: {
    container: 'border-red-200 bg-red-50 text-red-950',
    iconColor: 'text-red-700',
    Icon: AlertCircle,
  },
  warning: {
    container: 'border-amber-200 bg-amber-50 text-amber-950',
    iconColor: 'text-amber-700',
    Icon: AlertTriangle,
  },
  info: {
    container: 'border-blue-200 bg-blue-50 text-blue-950',
    iconColor: 'text-blue-700',
    Icon: Info,
  },
};

export function AlertBanner({
  variant,
  title,
  description,
  onRetry,
  retryLabel = 'Coba Lagi',
  onDismiss,
  className = '',
}: AlertBannerProps) {
  const { container, iconColor, Icon } = STYLES[variant];

  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={`flex flex-col gap-3 rounded-xl border px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between ${container} ${className}`}
    >
      <div className="flex items-start gap-3">
        <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${iconColor}`} aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-sm font-semibold">{title}</p>
          {description && (
            <p className="mt-0.5 text-xs leading-relaxed opacity-90 sm:text-sm">
              {description}
            </p>
          )}
        </div>
      </div>

      {(onRetry || onDismiss) && (
        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          {onRetry && (
            <Button
              size="sm"
              variant="secondary"
              onClick={onRetry}
              leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
            >
              {retryLabel}
            </Button>
          )}
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Tutup pemberitahuan"
              className="rounded-lg p-1.5 opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
