// @vitest-environment happy-dom

import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Dialog } from "@/app/components/Dialog";

describe("Dialog", () => {
  it("no renderiza nada cuando open=false", () => {
    const { container } = render(
      <Dialog open={false} onClose={() => {}}>
        contenido
      </Dialog>
    );
    expect(container.firstChild).toBeNull();
  });

  it("renderiza con role=dialog y aria-modal=true cuando open=true", () => {
    render(
      <Dialog open onClose={() => {}} title="Confirmar" description="Mensaje">
        <button>Aceptar</button>
      </Dialog>
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(dialog.getAttribute("aria-labelledby")).toBeTruthy();
    expect(dialog.getAttribute("aria-describedby")).toBeTruthy();
    expect(screen.getByText("Confirmar")).toBeTruthy();
    expect(screen.getByText("Mensaje")).toBeTruthy();
  });

  it("invoca onClose al presionar Escape", async () => {
    const onClose = vi.fn();
    render(
      <Dialog open onClose={onClose}>
        <button>Aceptar</button>
      </Dialog>
    );
    const dialog = screen.getByRole("dialog");
    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("respeta dismissOnEscape=false", () => {
    const onClose = vi.fn();
    render(
      <Dialog open onClose={onClose} dismissOnEscape={false}>
        <button>Aceptar</button>
      </Dialog>
    );
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("invoca onClose al click sobre el backdrop", () => {
    const onClose = vi.fn();
    const { container } = render(
      <Dialog open onClose={onClose}>
        <button>Aceptar</button>
      </Dialog>
    );
    const backdrop = container.firstChild as HTMLElement;
    fireEvent.mouseDown(backdrop, { target: backdrop });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("NO cierra cuando se hace mousedown sobre el contenido del dialog", () => {
    const onClose = vi.fn();
    render(
      <Dialog open onClose={onClose}>
        <button>Aceptar</button>
      </Dialog>
    );
    const dialog = screen.getByRole("dialog");
    fireEvent.mouseDown(dialog);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("respeta dismissOnBackdrop=false", () => {
    const onClose = vi.fn();
    const { container } = render(
      <Dialog open onClose={onClose} dismissOnBackdrop={false}>
        <button>Aceptar</button>
      </Dialog>
    );
    const backdrop = container.firstChild as HTMLElement;
    fireEvent.mouseDown(backdrop, { target: backdrop });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("mueve el foco al primer elemento focusable al abrir", () => {
    render(
      <Dialog open onClose={() => {}}>
        <button>Primero</button>
        <button>Segundo</button>
      </Dialog>
    );
    expect(document.activeElement?.textContent).toBe("Primero");
  });

  it("respeta initialFocusId", () => {
    render(
      <Dialog open onClose={() => {}} initialFocusId="confirm-btn">
        <button>Cancelar</button>
        <button id="confirm-btn">Confirmar</button>
      </Dialog>
    );
    expect(document.activeElement?.textContent).toBe("Confirmar");
  });

  it("atrapa Tab dentro del dialog (Shift+Tab desde el primero va al último)", async () => {
    const user = userEvent.setup();
    render(
      <Dialog open onClose={() => {}}>
        <button>A</button>
        <button>B</button>
        <button>C</button>
      </Dialog>
    );
    // El primero recibe foco al abrir.
    expect(document.activeElement?.textContent).toBe("A");
    await user.tab({ shift: true });
    expect(document.activeElement?.textContent).toBe("C");
  });

  it("atrapa Tab dentro del dialog (Tab desde el último vuelve al primero)", async () => {
    const user = userEvent.setup();
    render(
      <Dialog open onClose={() => {}} initialFocusId="last-btn">
        <button>A</button>
        <button>B</button>
        <button id="last-btn">C</button>
      </Dialog>
    );
    expect(document.activeElement?.textContent).toBe("C");
    await user.tab();
    expect(document.activeElement?.textContent).toBe("A");
  });
});
