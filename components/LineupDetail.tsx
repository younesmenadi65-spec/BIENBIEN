"use client";
import { useEffect, useState } from "react";
import { supabase, type Category, type Lineup } from "@/lib/supabase";

type Media = { id: string; path: string; kind: string; caption: string | null };
export default function LineupDetail({ lineup, cat, onClose }: { lineup: Lineup; cat?: Category; onClose: () => void }) {
  const [media, setMedia] = useState<Media[]>([]);
  const [steps, setSteps] = useState<{ id: string; body: string }[]>([]);
  const [msg, setMsg] = useState("");
  useEffect(() => {
    supabase.from("lineup_media").select("id,path,kind,caption").eq("lineup_id", lineup.id).order("position").then(({ data }) => setMedia(data ?? []));
    supabase.from("lineup_steps").select("id,body").eq("lineup_id", lineup.id).order("position").then(({ data }) => setSteps(data ?? []));
    supabase.rpc("increment_views", { p_id: lineup.id });
  }, [lineup.id]);
  const url = (p: string) => supabase.storage.from("lineup-media").getPublicUrl(p).data.publicUrl;
  async function share() { await navigator.clipboard.writeText(`${location.origin}/map?l=${lineup.id}`); setMsg("Lien copié."); }
  async function report() {
    const reason = prompt("Pourquoi signaler cette lineup ?"); if (!reason || reason.trim().length < 3) return;
    const { error } = await supabase.from("reports").insert({ lineup_id: lineup.id, reason: reason.trim() });
    setMsg(error ? "Signalement impossible." : "Merci, signalement envoyé.");
  }
  return (
    <div className="detail">
      <button className="sm" onClick={onClose}>← Retour à la liste</button>
      <h2 style={{ marginTop: 12 }}>{lineup.title}</h2>
      <p><span style={{ color: cat?.color }}>●</span> {cat?.label} · publiée le {new Date(lineup.created_at).toLocaleDateString("fr-FR")} · {lineup.views_count} vue(s)</p>
      {lineup.description && <p>{lineup.description}</p>}
      {media.map((m) => (<figure key={m.id} style={{ margin: 0 }}>
        {m.kind === "video" ? <video src={url(m.path)} controls preload="metadata" /> : <a href={url(m.path)} target="_blank"><img src={url(m.path)} alt={m.caption ?? lineup.title} loading="lazy" /></a>}
        {m.caption && <figcaption style={{ color: "var(--mute)" }}>{m.caption}</figcaption>}</figure>))}
      {steps.length > 0 && <ol>{steps.map((s) => <li key={s.id}>{s.body}</li>)}</ol>}
      <p><button className="sm" onClick={share}>Partager</button> <button className="sm" onClick={report}>Signaler</button> {msg}</p>
    </div>
  );
}
