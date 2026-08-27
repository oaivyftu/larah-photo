import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { usePointerLabel } from "./usePointerLabel";
import { getPointerLabel, releasePointerLabel } from "./pointerLabelStore";

// The hook's job is to keep a global label in step with a local pointer, and
// its two rules both exist because of real input behaviour: a touch tap fires
// pointer events with pointerType "touch" and must not leave a label stranded
// with no mouse to clear it, and an element unmounting mid-hover must not
// either.

function Target({ label = "View project" }: { label?: string }) {
  const { hidePointerLabel, pointerLabelHandlers } =
    usePointerLabel<HTMLButtonElement>(label);

  return (
    <button onClick={hidePointerLabel} type="button" {...pointerLabelHandlers}>
      {label}
    </button>
  );
}

function pointer(type: string) {
  return { pointerType: type };
}

beforeEach(() => {
  const reset = Symbol("reset");
  releasePointerLabel(reset);
});

afterEach(cleanup);

describe("usePointerLabel", () => {
  it("claims the label when a mouse enters", () => {
    render(<Target />);

    fireEvent.pointerEnter(screen.getByRole("button"), pointer("mouse"));

    expect(getPointerLabel()).toBe("View project");
  });

  it("keeps claiming while the mouse moves inside", () => {
    render(<Target />);
    const button = screen.getByRole("button");

    fireEvent.pointerMove(button, pointer("mouse"));

    expect(getPointerLabel()).toBe("View project");
  });

  it("releases when the mouse leaves", () => {
    render(<Target />);
    const button = screen.getByRole("button");

    fireEvent.pointerEnter(button, pointer("mouse"));
    fireEvent.pointerLeave(button, pointer("mouse"));

    expect(getPointerLabel()).toBeNull();
  });

  it.each(["touch", "pen"])("ignores a %s pointer entirely", (pointerType) => {
    // A tap fires enter and never leaves, so claiming here would strand the
    // label on screen with no mouse to clear it.
    render(<Target />);
    const button = screen.getByRole("button");

    fireEvent.pointerEnter(button, pointer(pointerType));

    expect(getPointerLabel()).toBeNull();
  });

  it("lets the caller hide the label on its own, for a click that navigates", () => {
    render(<Target />);
    const button = screen.getByRole("button");

    fireEvent.pointerEnter(button, pointer("mouse"));
    fireEvent.click(button);

    expect(getPointerLabel()).toBeNull();
  });

  it("releases the label when the element unmounts mid-hover", () => {
    const { unmount } = render(<Target />);

    fireEvent.pointerEnter(screen.getByRole("button"), pointer("mouse"));
    unmount();

    expect(getPointerLabel()).toBeNull();
  });

  it("re-claims under a fresh token when the label changes", () => {
    const { rerender } = render(<Target label="Before" />);
    fireEvent.pointerEnter(screen.getByRole("button"), pointer("mouse"));

    rerender(<Target label="After" />);
    fireEvent.pointerEnter(screen.getByRole("button"), pointer("mouse"));

    expect(getPointerLabel()).toBe("After");
  });

  it("does not blank a newer label when an older target leaves late", () => {
    render(
      <>
        <Target label="First" />
        <Target label="Second" />
      </>,
    );
    const [first, second] = screen.getAllByRole("button");

    fireEvent.pointerEnter(first!, pointer("mouse"));
    fireEvent.pointerEnter(second!, pointer("mouse"));
    fireEvent.pointerLeave(first!, pointer("mouse"));

    expect(getPointerLabel()).toBe("Second");
  });
});
