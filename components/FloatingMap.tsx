"use client";
import { useRef, useState, type ReactNode } from "react";

export default function FloatingMap({ children }: { children: ReactNode }) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [big, setBig] = useState(false);
  const [open, setOpen] = useState(true);
  const box = useRef<HTMLDivElement>(null);
  const drag = useRef<{ dx: number; dy: number } | null>(null);

  const clamp = (x: number, y: number) => {
    const w = box.current?.offsetWidth ?? 300;
    const h = box.current?.offsetHeight ?? 40;
    return {
      x: Math.min(Math.max(0, x), window.innerWidth - w),
      y: Math.min(Math.max(0, y), window.innerHeight - h),
    };
  };

  function down(e: React.PointerEvent) {
    if ((e.target as HTMLElement).closest("button") || !box.current) return;
    const r = box.current.getBoundingClientRect();
    drag.current = { dx: e.clientX - r.left, dy: e.clientY - r.top };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }
  function move(e: React.PointerEvent) {
    if (!drag.current) return;
    setPos(clamp(e.clientX - drag.current.dx, e.clientY - drag.current.dy));
  }
  function up() {
    drag.current = null;
  }

  return (
    <div
      ref={box}
      className="fmap"
      data-big={big ? "1" : undefined}
      style={pos ? { left: pos.x, top: pos.y } : { right: 16, bottom: 16 }}
    >
      <div className="fmap-bar" onPointerDown={down} onPointerMove={move} onPointerUp={up}>
        <span>Carte</span>
        <span>
          <button onClick={() => setBig((b) => !b)} aria-label={big ? "Réduire la carte" : "Agrandir la carte"}>
            {big ? "−" : "⤢"}
          </button>
          <button onClick={() => setOpen((o) => !o)} aria-label={open ? "Replier la carte" : "Déplier la carte"}>
            {open ? "▾" : "▴"}
          </button>
        </span>
      </div>
      <div className="fmap-body" hidden={!open}>
        {children}
      </div>
    </div>
  );
}
