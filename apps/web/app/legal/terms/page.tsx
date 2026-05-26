import type { Metadata } from "next";
import Link from "next/link";
import { AppSidebar } from "@/app/components/AppSidebar";
import { Footer } from "@/app/components/Footer";

export const metadata: Metadata = {
  title: "Términos de uso · Cortala",
  description:
    "Reglas de uso del servicio Cortala: qué puedes hacer, qué no, y cuándo podemos desactivar un enlace.",
};

const SECTIONS = [
  {
    id: "servicio",
    title: "Qué es Cortala",
    body: (
      <>
        <p>
          Cortala es un servicio gratuito que acorta URLs y mide los clics
          generados. No hay planes de pago, no hay funciones premium, no
          pedimos tarjeta de crédito.
        </p>
        <p>
          Al usar el servicio aceptas estos términos. Si no estás de acuerdo
          con alguno, no uses el servicio.
        </p>
      </>
    ),
  },
  {
    id: "uso-aceptable",
    title: "Uso aceptable",
    body: (
      <>
        <p>No puedes usar Cortala para acortar enlaces que apunten a:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Malware, ransomware, exploits o cualquier carga maliciosa.</li>
          <li>Phishing, suplantación de identidad o estafas.</li>
          <li>
            Contenido sexual con menores, apología del terrorismo o cualquier
            material ilegal según la legislación aplicable.
          </li>
          <li>
            Spam masivo: envíos automatizados a listas no consentidas, scrapers
            agresivos contra el servicio, o reutilización del API para revender
            acortamientos como propios.
          </li>
        </ul>
        <p>
          Tampoco puedes intentar saltar los límites técnicos del servicio
          (rate limiting, validaciones de la API, etc.) ni acceder a cuentas
          que no son tuyas.
        </p>
      </>
    ),
  },
  {
    id: "desactivacion",
    title: "Cuándo podemos desactivar un enlace",
    body: (
      <>
        <p>
          Si detectamos que un enlace incumple las reglas anteriores, lo
          desactivamos sin previo aviso. Si el incumplimiento es repetido o
          grave, también podemos cerrar la cuenta.
        </p>
        <p>
          Si crees que un enlace tuyo se desactivó por error, escríbenos a{" "}
          <a
            href="mailto:hola@cortala.app"
            className="text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            hola@cortala.app
          </a>{" "}
          y lo revisamos.
        </p>
      </>
    ),
  },
  {
    id: "disponibilidad",
    title: "Disponibilidad del servicio",
    body: (
      <>
        <p>
          Cortala se ofrece &laquo;tal cual&raquo;. Hacemos lo razonable para
          que esté disponible las 24 horas, pero no garantizamos un SLA ni
          nos hacemos responsables de pérdidas derivadas de caídas, errores
          o cambios en el servicio.
        </p>
        <p>
          Podemos cambiar, suspender o cerrar funcionalidades en cualquier
          momento. Si cerramos el servicio entero, te avisaremos con al menos
          30 días para que puedas exportar tus enlaces.
        </p>
      </>
    ),
  },
  {
    id: "datos",
    title: "Tus datos",
    body: (
      <p>
        Cómo guardamos tus datos y cómo borrarlos está explicado en la{" "}
        <Link
          href="/legal/privacy"
          className="text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          política de privacidad
        </Link>
        . En resumen: poco, sin terceros, y puedes borrar todo desde tu
        perfil.
      </p>
    ),
  },
  {
    id: "cambios",
    title: "Cambios a estos términos",
    body: (
      <p>
        Si modificamos estos términos publicaremos la nueva versión aquí con
        la fecha actualizada. Si los cambios son importantes (por ejemplo,
        empezamos a cobrar por algo o cambia el modelo de datos) te
        avisaremos por correo con al menos 30 días de antelación.
      </p>
    ),
  },
];

export default function TermsPage() {
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
                Términos de uso
              </h1>
              <p className="mt-3 text-gray-600 dark:text-gray-300">
                Reglas claras y cortas. Lee al menos la sección de uso
                aceptable.
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
