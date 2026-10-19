"use client";

import { useSyncExternalStore } from "react";

// Tiny shared state between the header Menu button, the landing page's left
// rail, and the project stage: whether the inline menu is open, and which
// featured case is selected, and whether the landing side picker is showing.
type UiState = { menuOpen: boolean; activeCase: number; railVisible: boolean };

let state: UiState = { menuOpen: false, activeCase: 0, railVisible: true };
const listeners = new Set<() => void>();

export function setUi(patch: Partial<UiState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const initial: UiState = { menuOpen: false, activeCase: 0, railVisible: true };

export function useUi<T>(select: (s: UiState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => select(state),
    () => select(initial),
  );
}
