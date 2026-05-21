"use client";

import { useState } from "react";

// Lets the owner recolor the link's QR code and download the PNG.
export function QrCustomizer({ linkId }: { linkId: string }) {
  const [dark, setDark] = useState("#000000");
  const [light, setLight] = useState("#ffffff");

  const src = `/api/qr/${linkId}?dark=${dark.slice(1)}&light=${light.slice(1)}`;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-5">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
        Código QR
      </h3>
      <div className="flex flex-wrap items-center gap-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt="Código QR del enlace"
          width={160}
          height={160}
          className="rounded border border-gray-200 dark:border-gray-700"
        />
        <div className="space-y-3 text-sm">
          <label className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
            <span className="w-20">Color</span>
            <input
              type="color"
              value={dark}
              onChange={(e) => setDark(e.target.value)}
              className="h-8 w-12 rounded border border-gray-300 dark:border-gray-600"
            />
          </label>
          <label className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
            <span className="w-20">Fondo</span>
            <input
              type="color"
              value={light}
              onChange={(e) => setLight(e.target.value)}
              className="h-8 w-12 rounded border border-gray-300 dark:border-gray-600"
            />
          </label>
          <a
            href={src}
            download={`qr-${linkId}.png`}
            className="inline-block py-2 px-4 rounded-lg text-sm font-medium text-white bg-gray-900 hover:bg-gray-800"
          >
            Descargar PNG
          </a>
        </div>
      </div>
    </div>
  );
}
