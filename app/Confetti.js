"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";

const COLORS = ["#ff595e", "#ffca3a", "#8ac926", "#1982c4", "#6a4c93"];

export default function Confetti() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Explosão inicial
    confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 }, colors: COLORS });

    // Confetes caindo continuamente do topo da tela
    let frame;
    let last = 0;
    const fall = (time) => {
      if (time - last > 120) {
        last = time;
        confetti({
          particleCount: 3,
          startVelocity: 0,
          ticks: 400,
          gravity: 0.6,
          drift: Math.random() - 0.5,
          origin: { x: Math.random(), y: -0.05 },
          colors: COLORS,
          scalar: 0.9 + Math.random() * 0.4,
        });
      }
      frame = requestAnimationFrame(fall);
    };
    frame = requestAnimationFrame(fall);

    return () => {
      cancelAnimationFrame(frame);
      confetti.reset();
    };
  }, []);

  return null;
}
