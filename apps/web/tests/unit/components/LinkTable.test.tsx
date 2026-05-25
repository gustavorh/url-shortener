// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { LinkTable, type LinkRow } from "@/app/dashboard/LinkTable";

const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock, push: vi.fn() }),
}));

const fetchMock = vi.fn();

beforeEach(() => {
  refreshMock.mockReset();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const rows: LinkRow[] = [
  {
    id: "promo",
    originalUrl: "https://example.com/promo",
    title: "Promoción",
    tags: "marketing",
    clicks: 5,
    disabled: false,
    creationDate: new Date("2026-05-01").toISOString(),
    expirationDate: null,
    activeFrom: null,
    maxClicks: null,
  },
  {
    id: "docs",
    originalUrl: "https://docs.example.com",
    title: null,
    tags: null,
    clicks: 10,
    disabled: false,
    creationDate: new Date("2026-05-02").toISOString(),
    expirationDate: null,
    activeFrom: null,
    maxClicks: null,
  },
];

function jsonOk(body: unknown = { ok: true, affected: 2 }) {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: async () => body,
  });
}

describe("LinkTable — selección", () => {
  it("no muestra la barra de acciones hasta seleccionar al menos una fila", () => {
    render(<LinkTable links={rows} baseUrl="http://localhost:3000" />);
    expect(screen.queryByRole("region", { name: /Acciones masivas/i })).toBeNull();
  });

  it("selecciona una fila y muestra la barra con el contador", () => {
    render(<LinkTable links={rows} baseUrl="http://localhost:3000" />);
    fireEvent.click(screen.getByLabelText("Seleccionar /promo"));
    expect(screen.getByRole("region", { name: /Acciones masivas/i })).toBeTruthy();
    expect(screen.getByText("1 seleccionado")).toBeTruthy();
  });

  it("checkbox 'Seleccionar todos' marca/desmarca todas las filas visibles", () => {
    render(<LinkTable links={rows} baseUrl="http://localhost:3000" />);
    const all = screen.getByLabelText(
      "Seleccionar todos los enlaces visibles"
    ) as HTMLInputElement;
    fireEvent.click(all);
    expect(screen.getByText("2 seleccionados")).toBeTruthy();
    fireEvent.click(all);
    expect(screen.queryByRole("region", { name: /Acciones masivas/i })).toBeNull();
  });

  it("'Cancelar selección' la limpia", () => {
    render(<LinkTable links={rows} baseUrl="http://localhost:3000" />);
    fireEvent.click(screen.getByLabelText("Seleccionar /promo"));
    fireEvent.click(screen.getByText("Cancelar selección"));
    expect(screen.queryByRole("region", { name: /Acciones masivas/i })).toBeNull();
  });
});

describe("LinkTable — acciones bulk", () => {
  it("Pausar llama a /api/links/bulk/disable con los ids seleccionados", async () => {
    fetchMock.mockReturnValue(jsonOk());
    render(<LinkTable links={rows} baseUrl="http://localhost:3000" />);
    fireEvent.click(
      screen.getByLabelText("Seleccionar todos los enlaces visibles")
    );
    fireEvent.click(screen.getByText("Pausar"));
    // Esperamos al siguiente tick para que el fetch se haya programado.
    await Promise.resolve();
    await Promise.resolve();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("/api/links/bulk/disable");
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({
      ids: ["promo", "docs"],
    });
  });

  it("Eliminar pide confirmación antes de llamar al endpoint", async () => {
    fetchMock.mockReturnValue(jsonOk());
    render(<LinkTable links={rows} baseUrl="http://localhost:3000" />);
    fireEvent.click(screen.getByLabelText("Seleccionar /promo"));
    fireEvent.click(screen.getByText("Eliminar"));
    // Aparece el diálogo de confirmación.
    expect(screen.getByText("Eliminar enlaces")).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("Sí, eliminar"));
    await Promise.resolve();
    await Promise.resolve();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("/api/links/bulk/delete");
  });

  it("Eliminar — Cancelar cierra el diálogo sin llamar al endpoint", () => {
    render(<LinkTable links={rows} baseUrl="http://localhost:3000" />);
    fireEvent.click(screen.getByLabelText("Seleccionar /promo"));
    fireEvent.click(screen.getByText("Eliminar"));
    fireEvent.click(screen.getByText("Cancelar"));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("Etiquetar envía tag + action al endpoint", async () => {
    fetchMock.mockReturnValue(jsonOk({ ok: true, affected: 2, tag: "marketing" }));
    render(<LinkTable links={rows} baseUrl="http://localhost:3000" />);
    fireEvent.click(
      screen.getByLabelText("Seleccionar todos los enlaces visibles")
    );
    fireEvent.click(screen.getByText("Etiquetar"));
    const input = screen.getByLabelText("Etiqueta") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "marketing" } });
    fireEvent.click(screen.getByText("Añadir etiqueta"));
    await Promise.resolve();
    await Promise.resolve();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("/api/links/bulk/tag");
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({
      ids: ["promo", "docs"],
      tag: "marketing",
      action: "add",
    });
  });
});
