"use client";
import { useRef, useState } from "react";
import type { Category, Lineup } from "@/lib/supabase";

type Props = {
  lineups: Lineup[]; categories: Category[]; selectedId?: string | null;
  placing?: boolean; draft?: { x: number; y: number } | null;
  onSelect?: (l: Lineup) => void; onPlace?: (p: { x: number; y: number }) => void;
};

export default function MapView2D({ lineups, categories, selectedId, placing, draft, onSelect, onPlace }: Props) {
  const [view, setView] = useState({ x: 0, y: 0, k: 1 });
  const [missing, setMissing] = useState(false);
  const img = useRef<HTMLDivElement>(null);
  const drag = useRef<{ sx: number; sy: number; ox: number; oy: number; moved: boolean } | null>(null);

  const zoom = (f: number) => setView((v) => ({ ...v, k: Math.min(6, Math.max(1, v.k * f)) }));
  const reset = () => setView({ x: 0, y: 0, k: 1 });

  function down(e: React.PointerEvent) {
    drag.current = { sx: e.clientX, sy: e.clientY, ox: view.x, oy: view.y, moved: false };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }
  function move(e: React.PointerEvent) {
    const d = drag.current; if (!d) return;
    const dx = e.clientX - d.sx, dy = e.clientY - d.sy;
    if (Math.abs(dx) + Math.abs(dy) > 5) d.moved = true;
    if (d.moved) setView((v) => ({ ...v, x: d.ox + dx, y: d.oy + dy }));
  }
  function up(e: React.PointerEvent) {
    const d = drag.current; drag.current = null;
    if (!d || d.moved || !placing || !img.current) return;
    const r = img.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    if (x >= 0 && x <= 1 && y >= 0 && y <= 1) onPlace?.({ x, y });
  }

  return (
    <div className="mapbox" data-placing={placing ? "1" : undefined}
      onWheel={(e) => zoom(e.deltaY < 0 ? 1.15 : 1 / 1.15)}
      onPointerDown={down} onPointerMove={move} onPointerUp={up}>
      <div ref={img} className="mapimg" style={{ transform: `translate(${view.x}px,${view.y}px) scale(${view.k})` }}>
        <img src="/map/rockford-v2b.png" alt="Plan de Rockford V2B" draggable={false} onError={() => setMissing(true)} />
        {lineups.map((l) => {
          const c = categories.find((c) => c.id === l.category_id);
          return (
            <button key={l.id} className="pin" aria-label={l.title} title={l.title}
              data-sel={l.id === selectedId ? "1" : undefined}
              style={{ left: `${l.map_x * 100}%`, top: `${l.map_y * 100}%`, background: c?.color, scale: String(1 / view.k) }}
              onPointerDown={(e) => e.stopPropagation()} onClick={() => onSelect?.(l)}>
              {c?.icon}
            </button>
          );
        })}
        {draft && <span className="pin draft" style={{ left: `${draft.x * 100}%`, top: `${draft.y * 100}%`, scale: String(1 / view.k) }}>+</span>}
      </div>
      {missing && <p className="mapmissing">Plan introuvable. Place ton image dans <code>public/map/rockford-v2b.png</code>.</p>}
      <div className="mapctl" onPointerDown={(e) => e.stopPropagation()}>
        <button onClick={() => zoom(1.3)} aria-label="Zoom avant">+</button>
        <button onClick={() => zoom(1 / 1.3)} aria-label="Zoom arrière">−</button>
        <button onClick={reset}>Vue générale</button>
      </div>
      {placing && <p className="maphint">Clique sur la carte pour placer le marqueur</p>}
    </div>
  );
}
