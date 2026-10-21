
export default function Home() {
  return (
    <main
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "10vh 20px 20px",
        minHeight: "calc(100vh - 53px)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ flex: 1 }}>
        <h1 style={{ fontFamily: "var(--font-head)", fontSize: 56, margin: 0, lineHeight: 1.05 }}>
          Rockford V2B Lineup Hub
        </h1>
        <p style={{ color: "var(--mute)", fontSize: 18, maxWidth: 560 }}>
          Les techniques et lineups de la communauté pour la map Rockford V2B de Garry’s Mod :
          smokes, flashs et nades, placées directement sur le plan de la ville.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 24 }}>
          <a className="cta" href="/map" style={{ textDecoration: "none" }}>
            Explorer la map
          </a>
          <a
            className="cta"
            href="/nouvelle"
            style={{ textDecoration: "none", background: "var(--panel)", border: "1px solid var(--line)" }}
          >
            Ajouter une lineup
          </a>
        </div>
      </div>
      <footer style={{ color: "var(--mute)", borderTop: "1px solid var(--line)", paddingTop: 16, marginTop: 40 }}>
        Créé par Whisky - Chef de spécialité Soldat
      </footer>
    </main>
  );
}
