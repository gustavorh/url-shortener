import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'Cortala - Acortador de URLs gratis y fácil de usar',
  description: 'Cortala es un servicio gratuito para acortar URLs y compartirlas fácilmente en redes sociales, mensajes o correos electrónicos. Rápido, seguro y sin registros.',
  keywords: 'acortador de URL, links cortos, URL shortener, recortar enlaces, acortar links, servicio gratis, herramienta web',
  openGraph: {
    title: 'Cortala - Acortador de URLs gratis y fácil de usar',
    description: 'La forma más rápida y sencilla de crear links cortos para compartir',
    url: 'https://cortala.com/',
    siteName: 'Cortala',
    locale: 'es_LA',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
