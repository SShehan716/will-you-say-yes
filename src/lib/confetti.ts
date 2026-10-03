export async function celebrate(): Promise<void> {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const confetti = (await import("canvas-confetti")).default;
  const heart = confetti.shapeFromText ? confetti.shapeFromText({ text: "❤️", scalar: 2 }) : undefined;
  const colors = ["#ff4d6d", "#ff8fa3", "#ffb3c1", "#c9184a", "#ffd6e0"];
  const fire = (originX: number) =>
    confetti({
      particleCount: 70,
      spread: 75,
      startVelocity: 45,
      origin: { x: originX, y: 0.7 },
      colors,
      ...(heart ? { shapes: [heart, "circle"], scalar: 1.6 } : {}),
    });
  fire(0.2);
  fire(0.8);
  setTimeout(() => fire(0.5), 350);
}
