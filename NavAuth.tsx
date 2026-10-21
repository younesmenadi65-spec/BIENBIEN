"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function NavAuth() {
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    const read = (s: { user: { email?: string; is_anonymous?: boolean } } | null) =>
      setName(s && !s.user.is_anonymous ? (s.user.email ?? "").split("@")[0] || "Connecté" : null);
    supabase.auth.getSession().then(({ data }) => read(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => read(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!name) return <a href="/login">Connexion</a>;
  return (
    <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
      <span style={{ color: "var(--mute)" }}>{name}</span>
      <button
        className="sm"
        onClick={async () => {
          await supabase.auth.signOut();
          window.location.href = "/";
        }}
      >
        Déconnexion
      </button>
    </span>
  );
}
