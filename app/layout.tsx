import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cortala - Acortador de URLs gratis y fácil de usar",
  description:
    "Cortala es un servicio gratuito para acortar URLs y compartirlas fácilmente en redes sociales, mensajes o correos electrónicos. Rápido, seguro y sin registros.",
  keywords:
    "acortador de URL, links cortos, URL shortener, recortar enlaces, acortar links, servicio gratis, herramienta web",
  openGraph: {
    title: "Cortala - Acortador de URLs gratis y fácil de usar",
    description:
      "La forma más rápida y sencilla de crear links cortos para compartir",
    url: "https://cortala.com/",
    siteName: "Cortala",
    locale: "es_LA",
    type: "website",
  },
};

// Applies the saved (or system) theme before paint to avoid a flash.
const themeScript = `(function(){try{var t=localStorage.getItem('theme');var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
