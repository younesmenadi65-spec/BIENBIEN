export default function Home() {
  return (
    <main style={{ maxWidth: 720, margin: "10vh auto", padding: 20 }}>
      <h1 style={{ fontFamily: "var(--font-head)", fontSize: 56, margin: 0 }}>Rockford V2B Lineup Hub</h1>
      <p style={{ color: "var(--mute)", fontSize: 18 }}>Les lineups et techniques de la communauté pour Rockford V2B, placées sur le plan de la ville.</p>
      <a className="cta" href="/map" style={{ display: "inline-block", textDecoration: "none" }}>Explorer la map</a>
    </main>
  );
}
