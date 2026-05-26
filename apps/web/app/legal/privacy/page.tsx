import type { Metadata } from "next";
import Link from "next/link";
import { AppSidebar } from "@/app/components/AppSidebar";
import { Footer } from "@/app/components/Footer";

export const metadata: Metadata = {
  title: "Política de privacidad · Cortala",
  description:
    "Qué datos guarda Cortala, cómo se anonimizan los clics, qué cookies usamos y cómo borrar tu cuenta.",
};

const SECTIONS = [
  {
    id: "que-guardamos",
    title: "Qué datos guardamos",
    body: (
      <>
        <p>
          Cuando creas una cuenta guardamos tu correo electrónico, tu nombre
          (si lo añades) y un hash de tu contraseña (algoritmo bcrypt — la
          contraseña original nunca se almacena ni se puede recuperar). Si
          inicias sesión con GitHub o Google guardamos también el identificador
          del proveedor para reconocerte en futuros accesos.
        </p>
        <p>
          De cada enlace que acortas guardamos: la URL original, el código
          corto, el alias si lo elegiste tú, la fecha de creación y los datos
          opcionales que tú añadas (contraseña, fecha de expiración, etiquetas,
          parámetros UTM).
        </p>
      </>
    ),
  },
  {
    id: "clics",
    title: "Datos de clics y anonimización",
    body: (
      <>
        <p>
          De cada clic guardamos la fecha y un resumen del navegador (sistema
          operativo, tipo de dispositivo, país aproximado derivado de la IP).
          Estos datos te aparecen agregados en la página de estadísticas.
        </p>
        <p>
          <strong className="text-gray-900 dark:text-white">
            No guardamos la dirección IP completa.
          </strong>{" "}
          Antes de escribir el clic en la base de datos truncamos el último
          octeto en IPv4 (por ejemplo, <code>203.0.113.42 → 203.0.113.0</code>)
          y conservamos solo los primeros 48 bits en IPv6. Es información
          suficiente para una estimación geográfica gruesa, pero no identifica
          un equipo concreto.
        </p>
      </>
    ),
  },
  {
    id: "cookies",
    title: "Cookies y trackers",
    body: (
      <>
        <p>
          Usamos exclusivamente las cookies estrictamente necesarias para el
          login: la cookie de sesión de Auth.js (necesaria para mantener la
          sesión iniciada) y, si lo activas, la cookie del proveedor OAuth
          durante el flujo de autorización.
        </p>
        <p>
          No usamos Google Analytics, Meta Pixel, Hotjar, ni ningún otro
          rastreador de terceros. No vendemos datos a nadie ni compartimos
          tu actividad con redes publicitarias.
        </p>
      </>
    ),
  },
  {
    id: "compartir",
    title: "Con quién compartimos los datos",
    body: (
      <>
        <p>
          Tus datos viven en nuestra base de datos y en una caché interna
          (Redis). No los enviamos a terceros, salvo dos excepciones que tú
          activas explícitamente:
        </p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>
            Webhooks que tú configures: cuando creas un webhook desde el
            dashboard, Cortala envía los eventos de tus enlaces a la URL
            que hayas indicado, firmados con HMAC-SHA256.
          </li>
          <li>
            Inicio de sesión OAuth: si te identificas con GitHub o Google,
            esos proveedores reciben la solicitud de autorización estándar.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "borrar",
    title: "Cómo borrar tu cuenta",
    body: (
      <>
        <p>
          Puedes borrar tu cuenta desde{" "}
          <Link
            href="/dashboard/profile"
            className="text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            tu perfil
          </Link>
          . Al borrarla eliminamos también todos tus enlaces, claves API,
          webhooks y registros de clics asociados. La operación es
          irreversible y los datos no se conservan en backups más allá de
          30 días.
        </p>
      </>
    ),
  },
  {
    id: "contacto",
    title: "Contacto",
    body: (
      <p>
        Para cualquier consulta sobre privacidad, escribe a{" "}
        <a
          href="mailto:hola@cortala.app"
          className="text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          hola@cortala.app
        </a>
        . Atendemos solicitudes de acceso, rectificación y borrado dentro
        de los 30 días naturales.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <AppSidebar />
      <div className="flex-1 flex flex-col mt-14 md:mt-0">
        <main className="flex-1 px-6 py-10 md:px-12 md:py-12">
          <article className="max-w-3xl mx-auto">
            <header className="mb-8">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Última actualización: mayo 2026
              </p>
              <h1 className="mt-2 text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                Política de privacidad
              </h1>
              <p className="mt-3 text-gray-600 dark:text-gray-300">
                Documento corto y honesto. Si algo no queda claro, escríbenos.
              </p>
            </header>

            <nav aria-label="Índice" className="mb-8 card p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
                En esta página
              </p>
              <ul className="space-y-1 text-sm">
                {SECTIONS.map((s) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className="text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      {s.title}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="space-y-10 text-gray-700 dark:text-gray-300 leading-relaxed">
              {SECTIONS.map((s) => (
                <section key={s.id} id={s.id} className="scroll-mt-16">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    {s.title}
                  </h2>
                  <div className="space-y-3">{s.body}</div>
                </section>
              ))}
            </div>
          </article>
        </main>
        <Footer />
      </div>
    </div>
  );
}
