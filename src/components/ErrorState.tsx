interface Props {
  title: string;
  message?: string;
  onRetry?: () => void;
  action?: React.ReactNode;
}

export function ErrorState({
  title,
  message = "Please check your internet connection and try again.",
  onRetry,
  action,
}: Props) {
  return (
    <div className="panel mx-auto mt-10 max-w-md text-center" role="alert">
      <p className="text-5xl" aria-hidden>
        😕
      </p>
      <h2 className="mt-3 font-display text-2xl font-bold text-ink">{title}</h2>
      <p className="mt-1 text-ink-soft">{message}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {onRetry && (
          <button type="button" className="btn-primary" onClick={onRetry}>
            Try again
          </button>
        )}
        {action}
      </div>
    </div>
  );
}
