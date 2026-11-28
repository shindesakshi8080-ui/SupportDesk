import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "danger" | "text";

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
  children: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-blue-700 text-white shadow-sm hover:bg-blue-800 disabled:bg-blue-400",
  secondary:
    "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:bg-slate-100",
  danger:
    "bg-rose-700 text-white shadow-sm hover:bg-rose-800 disabled:bg-rose-400",
  text: "text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:text-slate-400",
};

export default function Button({
  variant = "primary",
  loading = false,
  disabled = false,
  type = "button",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      aria-busy={loading || props["aria-busy"]}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-not-allowed ${variantClasses[variant]} ${className}`.trim()}
      disabled={disabled || loading}
      type={type}
    >
      {loading && (
        <svg
          aria-hidden="true"
          className="size-4 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="9"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            className="opacity-90"
            fill="currentColor"
            d="M12 3a9 9 0 0 0-9 9h3a6 6 0 0 1 6-6V3Z"
          />
        </svg>
      )}
      <span aria-atomic="true" aria-live={loading ? "polite" : undefined}>
        {children}
      </span>
    </button>
  );
}
