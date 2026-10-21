"use client";
import { useEffect, useState } from "react";
import MapView2D from "@/components/MapView2D";
import LineupDetail from "@/components/LineupDetail";
import { supabase, type Category, type Lineup } from "@/lib/supabase";

export default function MapPage() {
  const [cats, setCats] = useState<Category[]>([]);
  const [lineups, setLineups] = useState<Lineup[]>([]);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<Lineup | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [c, l] = await Promise.all([
        supabase.from("categories").select("*"),
        supabase.from("lineups").select("id,title,description,category_id,map_x,map_y,created_at,views_count")
          .eq("status", "published").order("created_at", { ascending: false }).limit(500),
      ]);
      if (c.error || l.error) setError("Impossible de charger les données. Vérifie ta connexion et ta configuration Supabase.");
      setCats(c.data ?? []); setLineups(l.data ?? []); setLoading(false);
      const id = new URLSearchParams(location.search).get("l");
      const found = (l.data ?? []).find((x) => x.id === id); if (found) setSel(found);
    })();
  }, []);

  const shown = lineups.filter((l) => !hidden.has(l.category_id) &&
    `${l.title} ${l.description ?? ""}`.toLowerCase().includes(q.toLowerCase()));
  const toggle = (id: string) => setHidden((h) => { const n = new Set(h); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <div className="layout">
      <aside className="side">
        {sel ? <LineupDetail lineup={sel} cat={cats.find((c) => c.id === sel.category_id)} onClose={() => setSel(null)} /> : (<>
        <a className="cta" href="/nouvelle" style={{ display: "block", textAlign: "center", textDecoration: "none", marginBottom: 12 }}>Ajouter une lineup</a>
        <h2>Lineups</h2>
        <input type="search" placeholder="Rechercher une lineup" value={q} onChange={(e) => setQ(e.target.value)}
          style={{ width: "100%", padding: 8, background: "var(--bg)", color: "var(--text)", border: "1px solid var(--line)", borderRadius: 6 }} />
        <div className="chips">
          {cats.map((c) => (
            <button key={c.id} className="chip" aria-pressed={!hidden.has(c.id)} onClick={() => toggle(c.id)}>
              <span style={{ color: c.color }}>●</span> {c.label}
            </button>
          ))}
        </div>
        {loading && <p>Chargement…</p>}
        {error && <p role="alert">{error}</p>}
        {!loading && !error && shown.length === 0 && <p>Aucune lineup pour l’instant. Sois le premier à en publier une.</p>}
        {shown.map((l) => (
          <button key={l.id} className="item" data-sel={sel?.id === l.id ? "1" : undefined} onClick={() => setSel(l)}>
            <strong>{l.title}</strong><br /><small>{cats.find((c) => c.id === l.category_id)?.label}</small>
          </button>
        ))}
        </>)}
      </aside>
      <MapView2D lineups={shown} categories={cats} selectedId={sel?.id} onSelect={setSel} />
    </div>
  );
}
