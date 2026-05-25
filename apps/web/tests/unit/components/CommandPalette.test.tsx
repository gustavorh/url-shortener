// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { CommandPalette } from "@/app/components/CommandPalette";

// Mock the bits the palette pulls from next-* so we can render it
// outside the full App Router runtime.
const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

const signOutMock = vi.fn();
vi.mock("next-auth/react", () => ({
  signOut: (...args: unknown[]) => signOutMock(...args),
}));

const fetchMock = vi.fn();

beforeEach(() => {
  pushMock.mockReset();
  signOutMock.mockReset();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  // Use a plain object instead of Response so happy-dom can't lock the
  // body stream after the first read (the component's useEffect may run
  // more than once).
  const sampleLinks = {
    links: [
      {
        id: "promo",
        shortUrl: "http://localhost/promo",
        originalUrl: "https://example.com/marketing",
        title: "Promoción de verano",
        disabled: false,
      },
      {
        id: "docs",
        shortUrl: "http://localhost/docs",
        originalUrl: "https://docs.example.com/intro",
        title: null,
        disabled: false,
      },
      {
        id: "paused",
        shortUrl: "http://localhost/paused",
        originalUrl: "https://example.com/internal",
        title: "Interno",
        disabled: true,
      },
    ],
  };
  fetchMock.mockImplementation(async () => ({
    ok: true,
    status: 200,
    json: async () => sampleLinks,
  }));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("CommandPalette", () => {
  it("no renderiza nada cuando open=false", () => {
    const { container } = render(
      <CommandPalette open={false} onClose={() => {}} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renderiza acciones de navegación cuando se abre", () => {
    render(<CommandPalette open onClose={() => {}} />);
    expect(screen.getByText("Ir al dashboard")).toBeTruthy();
    expect(screen.getByText("Claves de API")).toBeTruthy();
    expect(screen.getByText("Webhooks")).toBeTruthy();
    expect(screen.getByText("Cerrar sesión")).toBeTruthy();
  });

  it("invoca la navegación al hacer click sobre una acción", () => {
    const onClose = vi.fn();
    render(<CommandPalette open onClose={onClose} />);
    fireEvent.click(screen.getByText("Claves de API"));
    expect(pushMock).toHaveBeenCalledWith("/dashboard/keys");
    expect(onClose).toHaveBeenCalled();
  });

  it("filtra acciones según el query", () => {
    render(<CommandPalette open onClose={() => {}} />);
    const input = screen.getByLabelText("Buscar comandos") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "webhook" } });
    expect(screen.getByText("Webhooks")).toBeTruthy();
    expect(screen.queryByText("Claves de API")).toBeNull();
  });

  it("muestra los enlaces del usuario y los filtra por título/URL/id", async () => {
    render(<CommandPalette open onClose={() => {}} />);
    await screen.findByText("Promoción de verano");
    const input = screen.getByLabelText("Buscar comandos") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "docs" } });
    await waitFor(() => {
      // El enlace "docs" sigue, los otros desaparecen del bloque enlaces.
      expect(screen.queryByText("Promoción de verano")).toBeNull();
    });
  });

  it("navega a /stats/<id> al hacer click sobre un enlace", async () => {
    render(<CommandPalette open onClose={() => {}} />);
    const item = await screen.findByText("Promoción de verano");
    fireEvent.click(item);
    expect(pushMock).toHaveBeenCalledWith("/stats/promo");
  });

  it("muestra el badge 'pausado' para enlaces deshabilitados", async () => {
    render(<CommandPalette open onClose={() => {}} />);
    await screen.findByText("Interno");
    expect(screen.getByText("pausado")).toBeTruthy();
  });

  it("navegación con flechas + Enter invoca la acción resaltada", () => {
    const onClose = vi.fn();
    render(<CommandPalette open onClose={onClose} />);
    const input = screen.getByLabelText("Buscar comandos");
    // Disparamos en el input para que el keydown burbujee al handler.
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });
    // La segunda acción es "Claves de API".
    expect(pushMock).toHaveBeenCalledWith("/dashboard/keys");
  });

  it("Cerrar sesión llama a signOut", () => {
    render(<CommandPalette open onClose={() => {}} />);
    fireEvent.click(screen.getByText("Cerrar sesión"));
    expect(signOutMock).toHaveBeenCalledWith({ callbackUrl: "/" });
  });

  it("muestra 'Sin resultados' cuando el query no matchea nada", () => {
    render(<CommandPalette open onClose={() => {}} />);
    const input = screen.getByLabelText("Buscar comandos") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "asdfqwerty-zzz" } });
    expect(screen.getByText("Sin resultados.")).toBeTruthy();
  });
});
