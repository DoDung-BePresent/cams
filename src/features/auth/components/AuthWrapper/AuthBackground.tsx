import { useEffect, useRef } from 'react';

const COLORS = [
  '#3b82f6',
  '#8b5cf6',
  '#f43f5e',
  '#f59e0b',
  '#06b6d4',
  '#10b981',
];
const NOTES = ['♪', '♫', '♬', '♩', '𝄞', '♭', '♮'];
const PARTICLE_COUNT = 80; // Reduced count since notes are larger than dots

class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  note: string;
  ctx: CanvasRenderingContext2D;

  constructor(
    x: number,
    y: number,
    ctx: CanvasRenderingContext2D,
    colors: string[],
    notes: string[],
  ) {
    this.x = x;
    this.y = y;
    this.ctx = ctx;
    this.vx = (Math.random() - 0.5) * 1.5;
    this.vy = (Math.random() - 0.5) * 1.5;
    this.size = Math.random() * 16 + 12; // 12px to 28px
    this.color = colors[Math.floor(Math.random() * colors.length)];
    this.note = notes[Math.floor(Math.random() * notes.length)];
  }

  draw() {
    this.ctx.font = `${this.size}px "Outfit", sans-serif`;
    this.ctx.fillStyle = this.color;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(this.note, this.x, this.y);
  }

  update(
    width: number,
    height: number,
    mouse: { x: number; y: number; radius: number },
  ) {
    // Apply velocity
    this.x += this.vx;
    this.y += this.vy;

    // Wrap around screen
    if (this.x < 0) this.x = width;
    if (this.x > width) this.x = 0;
    if (this.y < 0) this.y = height;
    if (this.y > height) this.y = 0;

    // Mouse attraction
    const dx = mouse.x - this.x;
    const dy = mouse.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < mouse.radius) {
      const force = (mouse.radius - distance) / mouse.radius;
      const accel = force * 0.8;
      this.vx += (dx / distance) * accel;
      this.vy += (dy / distance) * accel;

      // Friction when pulled by mouse so it doesn't slingshot out of control
      this.vx *= 0.9;
      this.vy *= 0.9;
    } else {
      // Slow down when far from mouse
      this.vx *= 0.98;
      this.vy *= 0.98;

      // Maintain a minimum wandering speed
      const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      if (speed < 0.5) {
        this.vx += (Math.random() - 0.5) * 0.1;
        this.vy += (Math.random() - 0.5) * 0.1;
      }
    }
  }
}

export const AuthBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    let particles: Particle[] = [];
    const mouse = { x: width / 2, y: height / 2, radius: 250 };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      init();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);

    // Note: Particle class moved outside the component to satisfy lint rules.
    const init = () => {
      particles = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        particles.push(new Particle(x, y, ctx, COLORS, NOTES));
      }
    };

    let animationFrameId: number;
    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.update(width, height, mouse);
        p.draw();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    init();
    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className='fixed inset-0 -z-10 overflow-hidden bg-[#fafafa]'>
      <canvas
        ref={canvasRef}
        className='absolute inset-0 h-full w-full'
      />
      {/* Subtle overlay to soften the particles slightly */}
      <div className='pointer-events-none absolute inset-0 bg-white/30 backdrop-blur-[1px]' />
    </div>
  );
};
