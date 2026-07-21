import type { Metadata } from "next";
import { Outfit, Inter, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

/** Corpo/UI — alta legibilidade em tabela densa. Ver docs/dna-visual.md §4 Revisão R2. */
const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

/** Títulos/wordmark — geométrica, é o que dá o "premium" (`font-heading`). */
const outfit = Outfit({
  variable: "--font-heading",
  subsets: ["latin"],
});

/** Dado/numeral — inalterada: todo número em coluna usa mono + tabular-nums. */
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MDGEO Nexus | Sistema de Gestão Operacional",
  description: "Mockup navegável do sistema de gestão MDGEO Nexus — Hidrogeologia, Hidrologia e Hidroquímica",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${outfit.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <TooltipProvider delay={200}>{children}</TooltipProvider>
      </body>
    </html>
  );
}
