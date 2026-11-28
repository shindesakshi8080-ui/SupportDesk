import { useId, type InputHTMLAttributes, type ReactNode } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: ReactNode;
  helperText?: ReactNode;
  error?: ReactNode;
}

export default function Input({
  label,
  helperText,
  error,
  id,
  className = "",
  "aria-describedby": describedBy,
  "aria-invalid": ariaInvalid,
  required = false,
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const helperId = helperText ? `${inputId}-helper` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const descriptionIds = [describedBy, helperId, errorId].filter(Boolean);

  return (
    <>
      <label
        className="mb-2 block text-sm font-medium text-slate-800"
        htmlFor={inputId}
      >
        {label}
        {required && (
          <>
            <span aria-hidden="true"> *</span>
            <span className="sr-only"> (required)</span>
          </>
        )}
      </label>
      <input
        {...props}
        aria-describedby={
          descriptionIds.length > 0 ? descriptionIds.join(" ") : undefined
        }
        aria-invalid={error ? true : ariaInvalid}
        className={`w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 disabled:cursor-not-allowed disabled:bg-slate-50 ${className}`.trim()}
        id={inputId}
        required={required}
      />
      {helperText && (
        <p
          className="mt-2 text-xs leading-5 text-slate-500"
          id={helperId}
        >
          {helperText}
        </p>
      )}
      {error && (
        <p className="mt-2 text-sm text-rose-700" id={errorId} role="alert">
          {error}
        </p>
      )}
    </>
  );
}
