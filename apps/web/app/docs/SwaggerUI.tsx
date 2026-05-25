"use client";

import { useEffect, useRef } from "react";

// Thin wrapper that loads swagger-ui-dist on demand and mounts it into a div.
// We avoid swagger-ui-react because (a) its peer deps still target React 18
// and (b) doing it this way lets Next code-split the entire SwaggerUI bundle
// out of every other route.

interface Props {
  specUrl: string;
}

export function SwaggerUI({ specUrl }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ default: SwaggerUIBundle }] = await Promise.all([
        import("swagger-ui-dist/swagger-ui-bundle.js") as Promise<{
          default: (config: Record<string, unknown>) => unknown;
        }>,
        // The CSS is shipped beside the bundle. Importing it for its side
        // effects keeps the layout intact even after our own Tailwind reset.
        import("swagger-ui-dist/swagger-ui.css"),
      ]);
      if (cancelled || !containerRef.current) return;

      SwaggerUIBundle({
        domNode: containerRef.current,
        url: specUrl,
        deepLinking: true,
        // Hide the "try it out" servers selector noise; we already document
        // it in the spec header.
        layout: "BaseLayout",
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [specUrl]);

  return <div ref={containerRef} />;
}
