import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Project } from "@/types/project";

// The modal is where this app does its accessibility work: a focus trap, a
// scroll lock, `inert` on the page behind it, focus restored to whatever
// opened it, and Escape deferring to the image lightbox that stacks on top.
// None of that needs a browser -- it is DOM state and event handling -- and
// all of it is the kind that breaks silently, because the modal still looks
// right when the trap is gone.
//
// jsdom has no layout, so `getClientRects()` returns an empty list for every
// element. The component filters focusables by that, so without a stub the
// trap would see nothing focusable and every Tab test would pass vacuously.

const back = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ back }) }));

const { WorkDetailModal } = await import("./WorkDetailModal");

const CLOSE_DURATION = 360;

const project: Project = {
  id: "project-1",
  slug: "harbour-light",
  title: "Harbour Light",
  meta: "Wedding — 2026",
  category: "fine-art",
  year: "2026",
  location: "Ontario",
  description: "",
  image: "https://cdn.sanity.io/i/a.jpg",
  alt: "A bride on a clifftop",
  width: 1600,
  height: 900,
  images: [],
};

function renderModal(children = <a href="#one">One</a>) {
  return render(
    <WorkDetailModal project={project}>{children}</WorkDetailModal>,
  );
}

function setLightboxOpen(open: boolean) {
  if (open) document.documentElement.dataset["imageLightbox"] = "true";
  else delete document.documentElement.dataset["imageLightbox"];
}

let getClientRects: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  back.mockReset();
  setLightboxOpen(false);
  delete document.documentElement.dataset["modalNavigation"];
  document.body.style.overflow = "";
  // Pretend every element is laid out, so the focusable filter behaves as it
  // would in a browser.
  getClientRects = vi
    .spyOn(Element.prototype, "getClientRects")
    .mockReturnValue([{}] as unknown as DOMRectList);
});

afterEach(() => {
  cleanup();
  getClientRects.mockRestore();
  vi.useRealTimers();
});

describe("WorkDetailModal", () => {
  it("is a dialog labelled by the project title", () => {
    renderModal();
    const dialog = screen.getByRole("dialog");

    expect(dialog).toHaveAccessibleName("Harbour Light");
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("shows the project's category in a readable form", () => {
    renderModal();

    expect(screen.getByText("Fine Art")).toBeInTheDocument();
  });

  it("moves focus to the close button on open", () => {
    renderModal();

    expect(
      screen.getByRole("button", { name: /^Close Harbour Light/ }),
    ).toHaveFocus();
  });

  it("locks the page behind it from scrolling, and restores on close", () => {
    document.body.style.overflow = "auto";
    const { unmount } = renderModal();

    expect(document.body.style.overflow).toBe("hidden");

    unmount();
    expect(document.body.style.overflow).toBe("auto");
  });

  it("makes the page shell inert while open", () => {
    const shell = document.createElement("div");
    shell.setAttribute("data-page-shell", "");
    document.body.append(shell);

    const { unmount } = renderModal();
    expect(shell).toHaveAttribute("inert");

    unmount();
    expect(shell).not.toHaveAttribute("inert");
    shell.remove();
  });

  it("returns focus to whatever opened it", () => {
    const trigger = document.createElement("button");
    document.body.append(trigger);
    trigger.focus();

    const { unmount } = renderModal();
    unmount();

    expect(trigger).toHaveFocus();
    trigger.remove();
  });

  it("releases inert before restoring focus, since focus cannot enter an inert tree", () => {
    const shell = document.createElement("div");
    shell.setAttribute("data-page-shell", "");
    const trigger = document.createElement("button");
    shell.append(trigger);
    document.body.append(shell);
    trigger.focus();

    const { unmount } = renderModal();
    unmount();

    expect(shell).not.toHaveAttribute("inert");
    expect(trigger).toHaveFocus();
    shell.remove();
  });
});

describe("closing", () => {
  it("closes on Escape, after the exit animation", () => {
    renderModal();

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });

    // Not immediately: the sheet slides out first.
    expect(back).not.toHaveBeenCalled();
    act(() => void vi.advanceTimersByTime(CLOSE_DURATION));
    expect(back).toHaveBeenCalledOnce();
  });

  it("closes on the close button", () => {
    renderModal();

    fireEvent.click(screen.getByRole("button", { name: /^Close/ }));
    act(() => void vi.advanceTimersByTime(CLOSE_DURATION));

    expect(back).toHaveBeenCalledOnce();
  });

  it("closes when the backdrop itself is pressed", () => {
    renderModal();

    fireEvent.pointerDown(screen.getByRole("dialog"));
    act(() => void vi.advanceTimersByTime(CLOSE_DURATION));

    expect(back).toHaveBeenCalledOnce();
  });

  it("stays open when the press lands on the content", () => {
    renderModal();

    fireEvent.pointerDown(screen.getByText("Project preview"));
    act(() => void vi.advanceTimersByTime(CLOSE_DURATION));

    expect(back).not.toHaveBeenCalled();
  });

  it("navigates once however many times it is dismissed", () => {
    // Escape held down, or a click during the exit animation, would otherwise
    // pop two entries off the history stack.
    renderModal();
    const dialog = screen.getByRole("dialog");

    fireEvent.keyDown(dialog, { key: "Escape" });
    fireEvent.keyDown(dialog, { key: "Escape" });
    fireEvent.click(screen.getByRole("button", { name: /^Close/ }));
    act(() => void vi.advanceTimersByTime(CLOSE_DURATION * 3));

    expect(back).toHaveBeenCalledOnce();
  });

  it("flags the navigation so the page transition knows it was a modal", () => {
    renderModal();

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });

    expect(document.documentElement.dataset["modalNavigation"]).toBe("true");
  });

  it("cancels a pending close when unmounted mid-animation", () => {
    const { unmount } = renderModal();

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    unmount();
    act(() => void vi.advanceTimersByTime(CLOSE_DURATION * 2));

    expect(back).not.toHaveBeenCalled();
  });
});

/**
 * The same selector the component traps on, so the test does not assume the
 * order. It is not the reading order: ShareButton sits in the header above the
 * children, and the close button is last because it is a sibling of the sheet.
 */
function focusables(dialog: HTMLElement) {
  return Array.from(
    dialog.querySelectorAll<HTMLElement>(
      'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])',
    ),
  );
}

describe("the focus trap", () => {
  it("wraps from the last focusable back to the first on Tab", () => {
    renderModal(
      <>
        <a href="#one">One</a>
        <a href="#two">Two</a>
      </>,
    );
    const dialog = screen.getByRole("dialog");
    const elements = focusables(dialog);
    const first = elements[0]!;
    const last = elements.at(-1)!;

    last.focus();
    fireEvent.keyDown(dialog, { key: "Tab" });

    expect(first).toHaveFocus();
  });

  it("wraps from the first back to the last on Shift+Tab", () => {
    renderModal();
    const dialog = screen.getByRole("dialog");
    const elements = focusables(dialog);
    const first = elements[0]!;
    const last = elements.at(-1)!;

    first.focus();
    fireEvent.keyDown(dialog, { key: "Tab", shiftKey: true });

    expect(last).toHaveFocus();
  });

  it("puts the close button last, so Tab reaches the content first", () => {
    renderModal();

    expect(focusables(screen.getByRole("dialog")).at(-1)).toBe(
      screen.getByRole("button", { name: /^Close/ }),
    );
  });

  it("leaves Tab alone in the middle of the sequence", () => {
    renderModal(
      <>
        <a href="#one">One</a>
        <a href="#two">Two</a>
      </>,
    );
    const dialog = screen.getByRole("dialog");
    const middle = focusables(dialog)[1]!;

    middle.focus();
    fireEvent.keyDown(dialog, { key: "Tab" });

    // The browser handles it; the trap must not intervene.
    expect(middle).toHaveFocus();
  });

  it("ignores keys that are neither Escape nor Tab", () => {
    renderModal();

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "a" });
    act(() => void vi.advanceTimersByTime(CLOSE_DURATION));

    expect(back).not.toHaveBeenCalled();
  });
});

describe("deferring to the image lightbox stacked on top", () => {
  it("lets the lightbox keep Escape, rather than closing a level too far", () => {
    renderModal();
    setLightboxOpen(true);

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    act(() => void vi.advanceTimersByTime(CLOSE_DURATION));

    expect(back).not.toHaveBeenCalled();
  });

  // The component watches the attribute with a MutationObserver, whose
  // callback runs on a microtask -- so the act() has to be async or React
  // never sees the state update it triggers.
  async function toggleLightbox(open: boolean) {
    await act(async () => {
      setLightboxOpen(open);
    });
  }

  it("stands down as the modal dialog while the lightbox owns the screen", async () => {
    // Two nested aria-modal dialogs leave assistive tech guessing which one
    // confines the user.
    renderModal();

    await toggleLightbox(true);

    expect(screen.getByRole("dialog")).not.toHaveAttribute("aria-modal");
  });

  it("takes the modal role back when the lightbox closes", async () => {
    renderModal();
    await toggleLightbox(true);

    await toggleLightbox(false);

    expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "true");
  });

  it("makes its close button inert, so Tab and Enter cannot reach it", async () => {
    renderModal();

    await toggleLightbox(true);

    expect(screen.getByRole("button", { name: /^Close/ })).toHaveAttribute(
      "inert",
    );
  });

  it("notices a lightbox that was already open when the modal mounted", () => {
    setLightboxOpen(true);
    renderModal();

    expect(screen.getByRole("dialog")).not.toHaveAttribute("aria-modal");
  });
});
