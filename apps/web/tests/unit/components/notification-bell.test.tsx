// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";

// Stub next-auth so the bell sees an authenticated session without setting
// up SessionProvider/JWT plumbing.
vi.mock("next-auth/react", () => ({
  useSession: () => ({ status: "authenticated", data: { user: { id: "u1" } } }),
}));

// next/link is a thin wrapper around <a> in happy-dom test contexts.
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  } & Record<string, unknown>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

beforeEach(() => {
  // Reset to a known visible state for every test.
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => "visible",
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("<NotificationBell />", () => {
  it("fetches the unread count on mount and renders the badge when > 0", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify({ unread: 3 }), { status: 200 })
      );

    const { NotificationBell } = await import(
      "@/app/components/NotificationBell"
    );
    render(<NotificationBell />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/notifications/count",
        expect.objectContaining({ cache: "no-store" })
      );
    });

    const badge = await screen.findByTestId("notification-badge");
    expect(badge.textContent).toBe("3");
  });

  it("does not render the badge when unread is 0", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify({ unread: 0 }), { status: 200 })
      );

    const { NotificationBell } = await import(
      "@/app/components/NotificationBell"
    );
    render(<NotificationBell />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    // Give React one more flush so the state update settles.
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.queryByTestId("notification-badge")).toBeNull();
  });

  it("pauses polling when the document becomes hidden", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify({ unread: 1 }), { status: 200 })
      );

    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const { NotificationBell } = await import(
        "@/app/components/NotificationBell"
      );
      render(<NotificationBell />);

      // initial fetch on mount
      await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

      // 30s tick → one more polling request
      await act(async () => {
        await vi.advanceTimersByTimeAsync(30_000);
      });
      expect(fetchMock).toHaveBeenCalledTimes(2);

      // hide the tab; subsequent ticks should not fire any more requests
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        get: () => "hidden",
      });
      document.dispatchEvent(new Event("visibilitychange"));

      await act(async () => {
        await vi.advanceTimersByTimeAsync(60_000);
      });
      expect(fetchMock).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });
});
