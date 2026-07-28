import type { ReactNode } from 'react';

export type BadgeVariant =
  | 'active'
  | 'inactive'
  | 'confirmed'
  | 'cancelled'
  | 'completed';

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  inactive: 'bg-slate-100 text-slate-500 border-slate-200',
  confirmed: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  cancelled: 'bg-rose-50 text-rose-600 border-rose-200',
  completed: 'bg-slate-100 text-slate-600 border-slate-200',
};

interface BadgeProps {
  variant: BadgeVariant;
  children: ReactNode;
}

export function Badge({ variant, children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${VARIANT_STYLES[variant]}`}
    >
      {children}
    </span>
  );
}

// Convenience helper: maps the domain's isActive boolean to the right variant/label
export function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge variant={isActive ? 'active' : 'inactive'}>
      {isActive ? 'Active' : 'Inactive'}
    </Badge>
  );
}

const KNOWN_STATUS_VARIANTS: BadgeVariant[] = ['confirmed', 'cancelled', 'completed'];

// Maps a booking status string (e.g. "Confirmed") to a Badge variant.
// Falls back to 'inactive' (neutral slate) for any unrecognized status.
export function statusToVariant(status: string): BadgeVariant {
  const lower = status.toLowerCase();
  return (KNOWN_STATUS_VARIANTS as string[]).includes(lower)
    ? (lower as BadgeVariant)
    : 'inactive';
}