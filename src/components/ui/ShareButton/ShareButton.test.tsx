import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ShareButton } from "./ShareButton";

// The clipboard is the boundary worth mocking: it is undefined on insecure
// origins and rejects when permission is denied, and both land the user in the
// failure path. jsdom has no clipboard at all, so every test defines one.

const FEEDBACK_DURATION = 2400;

// The click handler is async, so the state update lands a microtask after the
// event. `act` flushes both, which keeps the assertions synchronous and stops
// React warning about an update outside act().
async function click(element: HTMLElement) {
  await act(async () => {
    fireEvent.click(element);
  });
}

function setClipboard(writeText: unknown) {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: writeText === undefined ? undefined : { writeText },
  });
}

beforeEach(() => {
  window.history.pushState({}, "", "/");
  setClipboard(vi.fn().mockResolvedValue(undefined));
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("ShareButton", () => {
  it("names the thing it copies, not just the action", () => {
    render(<ShareButton path="/work/a" title="Summer Editorial" />);

    expect(
      screen.getByRole("button", { name: "Copy link to Summer Editorial" }),
    ).toBeInTheDocument();
  });

  it("copies an absolute url built from the origin the visitor is on", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    setClipboard(writeText);
    render(<ShareButton path="/work/summer" title="Summer" />);

    await click(screen.getByRole("button"));

    // Not NEXT_PUBLIC_SITE_URL: a deploy that forgot to set that would
    // otherwise hand every visitor a localhost link.
    expect(writeText).toHaveBeenCalledWith(
      `${window.location.origin}/work/summer`,
    );
  });

  it("confirms the copy in the label and in a live region", async () => {
    render(<ShareButton path="/work/a" title="A" />);

    await click(screen.getByRole("button"));

    expect(
      await screen.findByRole("button", { name: /Copy link to A/ }),
    ).toHaveTextContent("Copied to clipboard");
    expect(screen.getByRole("status")).toHaveTextContent("Copied to clipboard");
  });

  it("reports failure when the clipboard rejects", async () => {
    setClipboard(vi.fn().mockRejectedValue(new Error("denied")));
    render(<ShareButton path="/work/a" title="A" />);

    await click(screen.getByRole("button"));

    expect(screen.getByRole("button")).toHaveTextContent("Copy failed");
    expect(screen.getByRole("status")).toHaveTextContent("Copy failed");
  });

  it("reports failure when there is no clipboard at all", async () => {
    // Insecure origins have no navigator.clipboard, so the property access
    // throws rather than the promise rejecting.
    setClipboard(undefined);
    render(<ShareButton path="/work/a" title="A" />);

    await click(screen.getByRole("button"));

    expect(screen.getByRole("button")).toHaveTextContent("Copy failed");
  });

  it("stays silent until pressed", () => {
    render(<ShareButton path="/work/a" title="A" />);

    expect(screen.getByRole("status")).toBeEmptyDOMElement();
    expect(screen.getByRole("button")).toHaveTextContent("Share");
  });

  it("returns to Share after the feedback holds", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<ShareButton path="/work/a" title="A" />);

    await click(screen.getByRole("button"));
    expect(screen.getByRole("button")).toHaveTextContent("Copied to clipboard");

    vi.advanceTimersByTime(FEEDBACK_DURATION);
    await waitFor(() =>
      expect(screen.getByRole("button")).toHaveTextContent("Share"),
    );
  });

  it("restarts the hold when pressed again mid-feedback", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<ShareButton path="/work/a" title="A" />);
    const button = screen.getByRole("button");

    await click(button);
    vi.advanceTimersByTime(FEEDBACK_DURATION - 100);
    await click(button);
    vi.advanceTimersByTime(200);

    // The first timer would have fired by now; the second press must have
    // cleared it, or the label would flick back to Share while still copying.
    expect(button).toHaveTextContent("Copied to clipboard");
  });

  it("exposes the status for styling", async () => {
    render(<ShareButton path="/work/a" title="A" />);
    const button = screen.getByRole("button");

    expect(button).toHaveAttribute("data-status", "idle");
    await click(button);
    expect(button).toHaveAttribute("data-status", "copied");
  });
});
