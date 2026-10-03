const HEARTS = ["❤", "💕", "💗", "♥", "💖"];

/** Decorative hearts drifting upward. Deterministic layout to avoid hydration mismatches. */
export function FloatingHearts({ count = 18 }: { count?: number }) {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-0 overflow-hidden">
      {Array.from({ length: count }, (_, i) => {
        const left = (i * 37 + 11) % 100;
        const size = 14 + ((i * 7) % 22);
        const duration = 11 + ((i * 5) % 10);
        const delay = -((i * 13) % 20);
        return (
          <span
            key={i}
            className="floating-heart"
            style={{
              left: `${left}%`,
              fontSize: size,
              animationDuration: `${duration}s`,
              animationDelay: `${delay}s`,
              opacity: 0.18 + ((i * 3) % 5) / 20,
            }}
          >
            {HEARTS[i % HEARTS.length]}
          </span>
        );
      })}
    </div>
  );
}
