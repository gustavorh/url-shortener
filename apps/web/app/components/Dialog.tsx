"use client";

import {
  type ReactNode,
  type RefObject,
  useCallback,
  useEffect,
  useId,
  useRef,
} from "react";

// Accessible modal dialog primitive. Used by webhooks UI, command palette,
// bulk-action confirms and anything else that needs a focused overlay.
//
// Behaviour:
//   - role="dialog" + aria-modal="true"; labelled by `title`, described by
//     `description` (both optional but recommended).
//   - ESC closes (unless dismissOnEscape=false).
//   - Click on the backdrop closes (unless dismissOnBackdrop=false).
//   - Focus is moved into the dialog on open and restored to the previously
//     focused element on close.
//   - Tab/Shift+Tab are trapped inside the dialog.

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  // Element id of a node inside `children` that should receive initial focus.
  // Falls back to the first focusable element, or the dialog container.
  initialFocusId?: string;
  dismissOnEscape?: boolean;
  dismissOnBackdrop?: boolean;
  // Tailwind sizing override; sensible default keeps things readable.
  className?: string;
}

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

function focusableWithin(node: HTMLElement): HTMLElement[] {
  return Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => !el.hasAttribute("aria-hidden")
  );
}

function useFocusTrap(
  open: boolean,
  containerRef: RefObject<HTMLDivElement | null>,
  initialFocusId?: string
): void {
  useEffect(() => {
    if (!open) return;
    const container = containerRef.current;
    if (!container) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    // Move focus into the dialog. Use initialFocusId when provided, else the
    // first focusable element, else the container itself (with tabindex).
    const initial = initialFocusId
      ? container.querySelector<HTMLElement>(`#${CSS.escape(initialFocusId)}`)
      : focusableWithin(container)[0] ?? container;
    initial?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const focusable = focusableWithin(container);
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    container.addEventListener("keydown", handleKeyDown);
    return () => {
      container.removeEventListener("keydown", handleKeyDown);
      // Restore focus to whoever opened the dialog.
      previouslyFocused?.focus?.();
    };
  }, [open, containerRef, initialFocusId]);
}

function useScrollLock(open: boolean): void {
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  initialFocusId,
  dismissOnEscape = true,
  dismissOnBackdrop = true,
  className,
}: DialogProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useFocusTrap(open, containerRef, initialFocusId);
  useScrollLock(open);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Escape" && dismissOnEscape) {
        event.stopPropagation();
        onClose();
      }
    },
    [onClose, dismissOnEscape]
  );

  const handleBackdropMouseDown = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!dismissOnBackdrop) return;
      // Only close when the click started on the backdrop itself, not on a
      // child element that happens to lose focus.
      if (event.target === event.currentTarget) onClose();
    },
    [onClose, dismissOnBackdrop]
  );

  if (!open) return null;

  return (
    // Backdrop wrapper: handles focus-trap key handling and click-to-dismiss
    // for the modal child. The interactive element is the inner role="dialog"
    // container; this outer div is a pure event delegator.
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={handleBackdropMouseDown}
      onKeyDown={handleKeyDown}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={
          className ??
          "w-full max-w-md rounded-lg bg-white dark:bg-gray-800 p-6 shadow-xl outline-none"
        }
      >
        {title && (
          <h2
            id={titleId}
            className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2"
          >
            {title}
          </h2>
        )}
        {description && (
          <p
            id={descriptionId}
            className="text-sm text-gray-600 dark:text-gray-400 mb-4"
          >
            {description}
          </p>
        )}
        {children}
      </div>
    </div>
  );
}
