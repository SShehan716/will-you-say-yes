export function HeartLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-rose-400">
      <span className="animate-heartbeat text-5xl" aria-hidden>
        💗
      </span>
      <span className="text-sm font-semibold">{label}</span>
    </div>
  );
}
