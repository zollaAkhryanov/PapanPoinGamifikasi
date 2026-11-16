import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';
import { ToastMessage } from '../../types';

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

const TOAST_STYLES: Record<
  ToastMessage['type'],
  { border: string; iconColor: string; Icon: typeof Info }
> = {
  success: {
    border: 'border-emerald-200 bg-white',
    iconColor: 'text-emerald-600',
    Icon: CheckCircle2,
  },
  error: {
    border: 'border-red-200 bg-white',
    iconColor: 'text-red-600',
    Icon: AlertCircle,
  },
  warning: {
    border: 'border-amber-200 bg-white',
    iconColor: 'text-amber-600',
    Icon: AlertTriangle,
  },
  info: {
    border: 'border-blue-200 bg-white',
    iconColor: 'text-blue-600',
    Icon: Info,
  },
};

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-full max-w-sm flex-col gap-2.5 pl-8 sm:pl-0"
    >
      {toasts.map((toast) => {
        const { border, iconColor, Icon } = TOAST_STYLES[toast.type];
        return (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-lg transition-all duration-150 ${border}`}
          >
            <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${iconColor}`} aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900">{toast.title}</p>
              {toast.description && (
                <p className="mt-0.5 text-xs text-slate-600 leading-relaxed">
                  {toast.description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              aria-label="Tutup notifikasi"
              className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
