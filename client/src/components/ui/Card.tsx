import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface CardProps {
  /**
   * Left blank for now — no image field exists on Category/Service/Element yet.
   * Once an imageUrl attribute is added, pass it through here.
   */
  imageUrl?: string | null;
  imageAlt: string;
  /** Rendered top-right, over the image slot (e.g. StatusBadge) */
  cornerBadge?: ReactNode;
  /** Main content: title, subtitle, description, attributes — variant-specific */
  children: ReactNode;
  footerLabel: string;
  footerTo?: string;
  onFooterClick?: () => void;
}

export function Card({
  imageUrl,
  imageAlt,
  cornerBadge,
  children,
  footerLabel,
  footerTo,
  onFooterClick,
}: CardProps) {
  const footerButton = (
    <button
      type="button"
      onClick={onFooterClick}
      className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
    >
      {footerLabel}
    </button>
  );

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* Image slot — blank placeholder until imageUrl exists on the model */}
      <div className="relative flex h-40 items-center justify-center bg-slate-100">
        {imageUrl ? (
          <img src={imageUrl} alt={imageAlt} className="h-full w-full object-cover" />
        ) : (
          <svg
            className="h-10 w-10 text-slate-300"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <circle cx="8.5" cy="10" r="1.5" />
            <path d="M21 15l-5-5-4 4-2-2-5 5" />
          </svg>
        )}
        {cornerBadge && (
          <div className="absolute right-3 top-3">{cornerBadge}</div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex-1">{children}</div>
        {footerTo ? (
          <Link to={footerTo} className="block">
            {footerButton}
          </Link>
        ) : (
          footerButton
        )}
      </div>
    </div>
  );
}
