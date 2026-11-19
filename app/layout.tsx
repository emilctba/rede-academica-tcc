
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rede Acadêmica TCC | IF Baiano",
  description:
    "Uma comunidade acadêmica para conectar estudantes, compartilhar pesquisas e consultar trabalhos de conclusão de curso do IF Baiano Campus Uruçuca.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
