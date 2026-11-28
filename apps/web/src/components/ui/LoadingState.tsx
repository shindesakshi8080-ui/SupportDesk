interface LoadingStateProps {
  label?: string;
}

export default function LoadingState({
  label = "Loading...",
}: LoadingStateProps) {
  return (
    <div
      aria-live="polite"
      className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-8 text-center"
      role="status"
    >
      <span
        aria-hidden="true"
        className="size-7 animate-spin rounded-full border-[3px] border-blue-100 border-t-blue-700"
      />
      <span className="text-sm font-medium text-slate-600">{label}</span>
    </div>
  );
}
