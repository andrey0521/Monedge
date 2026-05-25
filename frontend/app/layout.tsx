import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Monedge — Tu gestor financiero con IA",
  description: "Controla tus ingresos, gastos y metas con inteligencia artificial.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.className}>
      <body className="min-h-screen bg-[#f5f7fa] antialiased">{children}</body>
    </html>
  );
}
