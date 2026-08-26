import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  claimPointerLabel,
  getPointerLabel,
  getServerPointerLabel,
  releasePointerLabel,
  subscribePointerLabel,
} from "./pointerLabelStore";

// Module-level singleton state, so every test starts by clearing it through
// the public surface. The ownership rule is the interesting part: pointerenter
// on a new target routinely lands before pointerleave on the old one, and a
// naive store would blank the label that had just replaced it.

const A = Symbol("a");
const B = Symbol("b");

beforeEach(() => {
  releasePointerLabel(A);
  releasePointerLabel(B);
  // Whoever holds it after those two, take it and drop it.
  const reset = Symbol("reset");
  claimPointerLabel(reset, "reset");
  releasePointerLabel(reset);
});

describe("pointerLabelStore", () => {
  it("starts empty", () => {
    expect(getPointerLabel()).toBeNull();
  });

  it("holds the label the claimant set", () => {
    claimPointerLabel(A, "View project");

    expect(getPointerLabel()).toBe("View project");
  });

  it("lets a second target take over from the first", () => {
    claimPointerLabel(A, "First");
    claimPointerLabel(B, "Second");

    expect(getPointerLabel()).toBe("Second");
  });

  it("ignores a release from a target that no longer owns the label", () => {
    // The real sequence: enter B, then leave A. A must not blank B's label.
    claimPointerLabel(A, "First");
    claimPointerLabel(B, "Second");
    releasePointerLabel(A);

    expect(getPointerLabel()).toBe("Second");
  });

  it("clears the label when its owner releases it", () => {
    claimPointerLabel(A, "First");
    releasePointerLabel(A);

    expect(getPointerLabel()).toBeNull();
  });

  it("notifies subscribers on claim and release", () => {
    const listener = vi.fn();
    subscribePointerLabel(listener);

    claimPointerLabel(A, "First");
    expect(listener).toHaveBeenCalledTimes(1);

    releasePointerLabel(A);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("does not notify when the same owner re-claims the same label", () => {
    // pointermove fires continuously, and every one of those calls claim().
    // Without this guard the whole tree re-renders on every mouse move.
    claimPointerLabel(A, "Same");
    const listener = vi.fn();
    subscribePointerLabel(listener);

    claimPointerLabel(A, "Same");
    claimPointerLabel(A, "Same");

    expect(listener).not.toHaveBeenCalled();
  });

  it("does notify when the same owner changes the label", () => {
    claimPointerLabel(A, "Before");
    const listener = vi.fn();
    subscribePointerLabel(listener);

    claimPointerLabel(A, "After");

    expect(listener).toHaveBeenCalledOnce();
    expect(getPointerLabel()).toBe("After");
  });

  it("does not notify when a non-owner releases", () => {
    claimPointerLabel(A, "First");
    const listener = vi.fn();
    subscribePointerLabel(listener);

    releasePointerLabel(B);

    expect(listener).not.toHaveBeenCalled();
  });

  it("stops notifying after unsubscribe", () => {
    const listener = vi.fn();
    subscribePointerLabel(listener)();

    claimPointerLabel(A, "First");

    expect(listener).not.toHaveBeenCalled();
  });

  it("reports no label on the server, so the markup hydrates from empty", () => {
    claimPointerLabel(A, "Client only");

    expect(getServerPointerLabel()).toBeNull();
  });
});
