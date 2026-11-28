import type { HTMLAttributes, ReactNode } from "react";

export type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: ReactNode;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-slate-100 text-slate-700 ring-slate-600/10",
  success: "bg-emerald-50 text-emerald-800 ring-emerald-700/10",
  warning: "bg-amber-50 text-amber-800 ring-amber-700/10",
  danger: "bg-rose-50 text-rose-800 ring-rose-700/10",
  info: "bg-blue-50 text-blue-800 ring-blue-700/10",
};

export default function Badge({
  variant = "default",
  className = "",
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      {...props}
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${variantClasses[variant]} ${className}`.trim()}
    >
      {children}
    </span>
  );
}
