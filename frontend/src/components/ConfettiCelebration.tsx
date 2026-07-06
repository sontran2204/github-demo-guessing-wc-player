import { useEffect } from "react";
import confetti from "canvas-confetti";

/** Wheel of Names style: quick center burst + short side spray. */
export function ConfettiCelebration() {
  useEffect(() => {
    const colors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#a855f7", "#ec4899", "#ffffff"];
    const timeouts: number[] = [];

    confetti({
      particleCount: 70,
      spread: 75,
      startVelocity: 42,
      origin: { y: 0.58 },
      colors,
      ticks: 90,
      gravity: 1.1,
      scalar: 1,
    });

    const sideCannons = () => {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        startVelocity: 48,
        origin: { x: 0, y: 0.62 },
        colors,
        ticks: 80,
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        startVelocity: 48,
        origin: { x: 1, y: 0.62 },
        colors,
        ticks: 80,
      });
    };

    sideCannons();
    timeouts.push(window.setTimeout(sideCannons, 180));

    return () => timeouts.forEach(clearTimeout);
  }, []);

  return null;
}
