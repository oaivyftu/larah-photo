const listeners = new Set<() => void>();

let label: string | null = null;
let owner: symbol | null = null;

function notify() {
  for (const listener of listeners) {
    listener();
  }
}

export function claimPointerLabel(token: symbol, next: string) {
  if (owner === token && label === next) {
    return;
  }

  owner = token;
  label = next;
  notify();
}

/**
 * Only the target that currently owns the label may clear it, so a
 * `pointerenter` that lands before the previous target's `pointerleave`
 * cannot blank the label that just replaced it.
 */
export function releasePointerLabel(token: symbol) {
  if (owner !== token) {
    return;
  }

  owner = null;
  label = null;
  notify();
}

export function subscribePointerLabel(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function getPointerLabel() {
  return label;
}

export function getServerPointerLabel(): string | null {
  return null;
}
