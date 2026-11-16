import { useState } from 'react';
import { getInitials } from '../../utils/levelUtils';

interface AvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<AvatarProps['size']>, string> = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
};

export function Avatar({ src, name, size = 'md', className = '' }: AvatarProps) {
  const [hasError, setHasError] = useState(false);
  const sizeClass = SIZE_CLASSES[size];

  if (!src || hasError) {
    return (
      <div
        aria-label={name}
        className={`inline-flex shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 font-display font-semibold text-slate-700 select-none ${sizeClass} ${className}`}
      >
        {getInitials(name)}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={`Foto profil ${name}`}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={`shrink-0 rounded-lg border border-slate-200 object-cover bg-slate-100 ${sizeClass} ${className}`}
    />
  );
}
