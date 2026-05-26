import Link from "next/link";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-12 border-t border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-900/60">
      <div className="max-w-5xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500 dark:text-gray-400">
        <p>© {year} Cortala — gratis, sin tiers, sin tracking de terceros.</p>
        <nav aria-label="Legal" className="flex items-center gap-4">
          <Link
            href="/legal/privacy"
            className="hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Privacidad
          </Link>
          <Link
            href="/legal/terms"
            className="hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Términos
          </Link>
          <a
            href="https://github.com/gustavorh/url-shortener"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Código fuente
          </a>
        </nav>
      </div>
    </footer>
  );
}
