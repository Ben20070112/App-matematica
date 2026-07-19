import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Plano A — Matemática A",
  description: "Acompanhamento de estudo para o exame nacional de Matemática A.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt">
      <body>{children}</body>
    </html>
  );
}
