"use client";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import MapView2D from "@/components/MapView2D";
import { supabase, supabaseConfigured, type Category } from "@/lib/supabase";

const MAX = 50 * 1024 * 1024;
const OK = ["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/webm"];
type M = { file: File; caption: string; url: string };

export default function NewLineup() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [cats, setCats] = useState<Category[]>([]);
  const [title, setTitle] = useState(""); const [cat, setCat] = useState("");
  const [desc, setDesc] = useState(""); const [steps, setSteps] = useState(""); const [kw, setKw] = useState("");
  const [media, setMedia] = useState<M[]>([]);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [busy, setBusy] = useState(false); const [progress, setProgress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [doneId, setDoneId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    supabase.from("categories").select("*").then(({ data }) => setCats(data ?? []));
    return () => sub.subscription.unsubscribe();
  }, []);

  async function login(e: React.FormEvent) {
    e.preventDefault(); setError(null);
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: location.origin + "/nouvelle" } });
    if (error) setError("Envoi impossible : " + error.message); else setSent(true);
  }

  function addFiles(list: FileList | null) {
    if (!list) return; const next: M[] = []; const bad: string[] = [];
    Array.from(list).forEach((f) => {
      if (!OK.includes(f.type)) bad.push(`${f.name} : format non accepté`);
      else if (f.size > MAX) bad.push(`${f.name} : dépasse 50 Mo`);
      else next.push({ file: f, caption: "", url: URL.createObjectURL(f) });
    });
    setError(bad.length ? bad.join(" — ") : null); setMedia((m) => [...m, ...next]);
  }
  const move = (i: number, d: number) => setMedia((m) => { const a = [...m]; const j = i + d; if (j < 0 || j >= a.length) return m; [a[i], a[j]] = [a[j], a[i]]; return a; });

  async function publish() {
    if (busy || !session) return; setError(null);
    if (title.trim().length < 3) return setError("Donne un nom d’au moins 3 caractères.");
    if (!cat) return setError("Choisis une catégorie.");
    if (!pos) return setError("Place la lineup sur la carte (étape 3).");
    setBusy(true);
    const id = crypto.randomUUID(); const uid = session.user.id; const paths: string[] = [];
    const fail = async (msg: string) => {
      if (paths.length) await supabase.storage.from("lineup-media").remove(paths);
      await supabase.from("lineups").delete().eq("id", id);
      setBusy(false); setProgress(""); setError(msg);
    };
    const { error: e1 } = await supabase.from("lineups").insert({
      id, author_id: uid, category_id: cat, title: title.trim(), description: desc.trim() || null,
      keywords: kw.split(",").map((s) => s.trim()).filter(Boolean), map_x: pos.x, map_y: pos.y,
    });
    if (e1) { setBusy(false); return setError(e1.message.includes("Limite") ? e1.message : "Publication impossible : " + e1.message); }
    const rows = [];
    for (let i = 0; i < media.length; i++) {
      setProgress(`Envoi du fichier ${i + 1} sur ${media.length}…`);
      const f = media[i].file; const ext = (f.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
      const path = `${uid}/${id}/${i}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
      const { error } = await supabase.storage.from("lineup-media").upload(path, f, { contentType: f.type });
      if (error) return fail(`Envoi de « ${f.name} » échoué (${error.message}). Rien n’a été publié, réessaie.`);
      paths.push(path);
      rows.push({ lineup_id: id, path, kind: f.type.startsWith("video") ? "video" : "image", caption: media[i].caption.trim() || null, position: i });
    }
    if (rows.length) { const { error } = await supabase.from("lineup_media").insert(rows); if (error) return fail("Médias non enregistrés : " + error.message); }
    const st = steps.split("\n").map((s) => s.trim()).filter(Boolean).map((body, position) => ({ lineup_id: id, position, body }));
    if (st.length) { const { error } = await supabase.from("lineup_steps").insert(st); if (error) return fail("Instructions non enregistrées : " + error.message); }
    setBusy(false); setProgress(""); setDoneId(id);
  }

  if (!supabaseConfigured) return <main className="form"><p className="err">Supabase n’est pas configuré (variables d’environnement manquantes).</p></main>;
  if (!ready) return <main className="form"><p>Chargement…</p></main>;
  if (!session) return (
    <main className="form"><h1>Ajouter une lineup</h1>
      <p>Connecte-toi avec ton email pour publier. Tu recevras un lien de connexion, sans mot de passe.</p>
      {sent ? <p className="ok">Lien envoyé à {email}. Ouvre ton email puis clique sur le lien. Pense à regarder les spams.</p> : (
        <form onSubmit={login} style={{ display: "grid", gap: 12 }}>
          <label>Email<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          <button className="cta">Recevoir le lien</button>
        </form>)}
      {error && <p className="err" role="alert">{error}</p>}
    </main>);
  if (doneId) return (
    <main className="form"><h1>Lineup publiée</h1>
      <div className="ok"><p>Ta lineup est en ligne et visible par tout le monde.</p>
        <a className="cta" style={{ textDecoration: "none", display: "inline-block" }} href={`/map?l=${doneId}`}>Voir la lineup sur la map</a></div></main>);

  return (
    <main className="form">
      <h1>Ajouter une lineup</h1>
      <fieldset><legend>1. Informations</legend>
        <label>Nom<input maxLength={100} value={title} onChange={(e) => setTitle(e.target.value)} /></label>
        <label>Catégorie<select value={cat} onChange={(e) => setCat(e.target.value)}><option value="">Choisir…</option>
          {cats.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select></label>
        <label>Description courte<textarea rows={2} maxLength={500} value={desc} onChange={(e) => setDesc(e.target.value)} /></label>
        <label>Instructions (une étape par ligne)<textarea rows={5} value={steps} onChange={(e) => setSteps(e.target.value)} placeholder={"Place-toi devant la porte\nVise le coin du toit\nLance en sautant"} /></label>
        <label>Mots-clés (séparés par des virgules)<input value={kw} onChange={(e) => setKw(e.target.value)} /></label>
      </fieldset>
      <fieldset><legend>2. Photos et vidéos</legend>
        <label>Ajouter des fichiers (images ou vidéos mp4/webm, 50 Mo max chacun)
          <input type="file" multiple accept={OK.join(",")} onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} /></label>
        {media.map((m, i) => (
          <div className="media" key={m.url}>
            {m.file.type.startsWith("video") ? <video src={m.url} muted /> : <img src={m.url} alt="" />}
            <input placeholder="Légende" value={m.caption} onChange={(e) => setMedia((a) => a.map((x, j) => j === i ? { ...x, caption: e.target.value } : x))} />
            <span><button type="button" className="sm" onClick={() => move(i, -1)} aria-label="Monter">↑</button>{" "}
              <button type="button" className="sm" onClick={() => move(i, 1)} aria-label="Descendre">↓</button>{" "}
              <button type="button" className="sm" onClick={() => setMedia((a) => a.filter((_, j) => j !== i))}>Retirer</button></span>
          </div>))}
      </fieldset>
      <fieldset><legend>3. Emplacement</legend>
        <p style={{ margin: 0 }}>{pos ? "Marqueur placé. Clique ailleurs pour le déplacer." : "Zoome si besoin, puis clique sur la carte à l’endroit de la lineup."}</p>
        <div className="formmap"><MapView2D lineups={[]} categories={cats} placing draft={pos} onPlace={setPos} /></div>
      </fieldset>
      <fieldset><legend>4. Publication</legend>
        <p style={{ margin: 0 }}><strong>{title || "Sans nom"}</strong> · {cats.find((c) => c.id === cat)?.label ?? "Catégorie ?"} · {media.length} fichier(s) · {pos ? "placée sur la carte" : "pas encore placée"}</p>
        {error && <p className="err" role="alert">{error}</p>}
        {progress && <p>{progress}</p>}
        <button className="cta" disabled={busy} onClick={publish}>{busy ? "Publication…" : "Publier la lineup"}</button>
      </fieldset>
    </main>
  );
}
