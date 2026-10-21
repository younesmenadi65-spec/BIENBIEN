"use client";
import { useState } from "react";
import { supabase, supabaseConfigured } from "@/lib/supabase";

const DOMAIN = "@rockford.hub";

export default function Login() {
  const [identifiant, setIdentifiant] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(null);
    const id = identifiant.trim().toLowerCase();
    if (!/^[a-z0-9._-]+$/.test(id)) {
      return setError("Identifiant invalide : lettres, chiffres, point, tiret ou underscore, sans espace.");
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: id + DOMAIN, password });
    setBusy(false);
    if (error) {
      return setError(
        error.message.includes("Invalid login")
          ? "Identifiant ou mot de passe incorrect."
          : "Connexion impossible : " + error.message
      );
    }
    window.location.href = "/map";
  }

  if (!supabaseConfigured)
    return <main className="form"><p className="err">Supabase n’est pas configuré.</p></main>;

  return (
    <main className="form" style={{ maxWidth: 420 }}>
      <h1>Connexion</h1>
      <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
        <label>Identifiant
          <input required autoComplete="username" autoCapitalize="none" value={identifiant}
            onChange={(e) => setIdentifiant(e.target.value)} />
        </label>
        <label>Mot de passe
          <input type="password" required autoComplete="current-password" value={password}
            onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && <p className="err" role="alert">{error}</p>}
        <button className="cta" disabled={busy}>{busy ? "Patiente…" : "Se connecter"}</button>
      </form>
      <p style={{ color: "var(--mute)" }}>Pas d’identifiant ? Il t’est donné par l’administrateur.</p>
    </main>
  );
}
