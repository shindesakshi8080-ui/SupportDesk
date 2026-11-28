interface ErrorStateProps {
  title?: string;
  message: string;
}

export default function ErrorState({
  title = "Something went wrong",
  message,
}: ErrorStateProps) {
  return (
    <div
      className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4"
      role="alert"
    >
      <h2 className="text-sm font-semibold text-rose-900">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-rose-800">{message}</p>
    </div>
  );
}
