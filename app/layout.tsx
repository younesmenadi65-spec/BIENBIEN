import "./globals.css";
import { Barlow_Condensed, Inter } from "next/font/google";
const head = Barlow_Condensed({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-head" });
const body = Inter({ subsets: ["latin"], variable: "--font-body" });
export const metadata = { title: "Rockford V2B Lineup Hub", description: "Lineups et techniques communautaires pour Rockford V2B (Garry's Mod)." };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr"><body className={`${head.variable} ${body.variable}`}>
      <header className="nav"><a className="logo" href="/">Rockford V2B Lineup Hub</a>
        <nav style={{display:"flex",gap:20}}><a href="/map">Explorer la map</a><a href="/nouvelle" style={{color:"var(--accent)"}}>Ajouter une lineup</a></nav></header>
      {children}
    </body></html>
  );
}
