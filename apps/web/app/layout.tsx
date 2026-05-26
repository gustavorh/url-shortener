import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
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
  twitter: {
    card: "summary_large_image",
    title: "Cortala - Acortador de URLs gratis y fácil de usar",
    description:
      "La forma más rápida y sencilla de crear links cortos para compartir",
  },
};

// Applies the saved (or system) theme before paint to avoid a flash.
const themeScript = `(function(){try{var t=localStorage.getItem('theme');var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:rounded-lg focus:bg-gray-900 focus:text-white focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          Saltar al contenido principal
        </a>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
