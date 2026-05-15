"use client";

import { useEffect, useRef } from "react";

const ICONS = ["N", "G", "S", "⌨", "⧉", ">", "≡", "★"];
const COLORS = [
  "#3b82f6", "#f59e0b", "#06b6d4", "#22c55e",
  "#ec4899", "#6366f1", "#64748b", "#a855f7",
];

interface Particle {
  icon: string;
  color: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  rotSpeed: number;
  scale: number;
  targetScale: number;
}

const REPEL_RADIUS = 80;
const REPEL_FORCE = 2.5;
const FRICTION = 0.92;
const SPEED_CAP = 3.5;

export function ChaosCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const particlesRef = useRef<Particle[]>([]);
  const animIdRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function resize() {
      if (!canvas || !container) return;
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    }

    function createParticles() {
      if (!canvas) return;
      particlesRef.current = ICONS.map((icon, i) => ({
        icon,
        color: COLORS[i],
        x: Math.random() * canvas.width * 0.7 + canvas.width * 0.15,
        y: Math.random() * canvas.height * 0.6 + canvas.height * 0.2,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        size: 32 + Math.random() * 14,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.02,
        scale: 1,
        targetScale: 1,
      }));
    }

    function drawIcon(p: Particle) {
      if (!ctx) return;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.scale(p.scale, p.scale);
      ctx.font = `${p.size}px monospace`;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = 0.85;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 12;
      ctx.fillText(p.icon, 0, 0);
      ctx.shadowBlur = 0;
      ctx.restore();
    }

    function updateParticle(p: Particle) {
      if (!canvas) return;
      const dx = p.x - mouseRef.current.x;
      const dy = p.y - mouseRef.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < REPEL_RADIUS && dist > 0.1) {
        const force = (1 - dist / REPEL_RADIUS) * REPEL_FORCE;
        p.vx += (dx / dist) * force;
        p.vy += (dy / dist) * force;
        p.targetScale = 1.3;
      } else {
        p.targetScale = 1;
      }
      p.scale += (p.targetScale - p.scale) * 0.12;
      p.vx *= FRICTION;
      p.vy *= FRICTION;
      p.vx += (Math.random() - 0.5) * 0.06;
      p.vy += (Math.random() - 0.5) * 0.06;

      const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      if (speed > SPEED_CAP) {
        p.vx = (p.vx / speed) * SPEED_CAP;
        p.vy = (p.vy / speed) * SPEED_CAP;
      }

      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotSpeed;

      const pad = p.size;
      if (p.x < pad) { p.x = pad; p.vx = Math.abs(p.vx); }
      if (p.x > canvas.width - pad) { p.x = canvas.width - pad; p.vx = -Math.abs(p.vx); }
      if (p.y < pad + 32) { p.y = pad + 32; p.vy = Math.abs(p.vy); }
      if (p.y > canvas.height - pad) { p.y = canvas.height - pad; p.vy = -Math.abs(p.vy); }
    }

    function loop() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particlesRef.current) {
        updateParticle(p);
        drawIcon(p);
      }
      animIdRef.current = requestAnimationFrame(loop);
    }

    const ro = new ResizeObserver(() => {
      resize();
      createParticles();
    });
    ro.observe(container);

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const onMouseLeave = () => {
      mouseRef.current = { x: -9999, y: -9999 };
    };

    container.addEventListener("mousemove", onMouseMove);
    container.addEventListener("mouseleave", onMouseLeave);

    resize();
    createParticles();
    loop();

    return () => {
      cancelAnimationFrame(animIdRef.current);
      ro.disconnect();
      container.removeEventListener("mousemove", onMouseMove);
      container.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden"
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}
