import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "La Lista",
  description: "Lo que falta en casa",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
