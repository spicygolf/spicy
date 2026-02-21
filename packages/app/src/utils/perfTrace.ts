/**
 * Dev-only performance tracing utilities for diagnosing Big Game (48+ player) slowdowns.
 *
 * All functions are no-ops in production builds.
 * Remove this file once performance investigation is complete.
 */

import { useEffect, useRef } from "react";

const ENABLED = __DEV__;

/** Track how many instances of a component are currently mounted */
const mountCounts = new Map<string, number>();

/** Track cumulative render counts per component name */
const renderCounts = new Map<string, number>();

/**
 * Log a render count for a component. Prints every `logEvery` renders.
 *
 * Usage: place `usePerfRenderCount("GamePlayersListItem")` at the top of a component.
 */
export function usePerfRenderCount(name: string, logEvery = 1): number {
  const count = useRef(0);
  count.current += 1;

  if (ENABLED && count.current % logEvery === 0) {
    const global = (renderCounts.get(name) ?? 0) + 1;
    renderCounts.set(name, global);
    console.log(`[PERF] ${name} render #${count.current} (global: ${global})`);
  }

  return count.current;
}

/**
 * Track mount/unmount of a component. Logs total mounted instances.
 *
 * Usage: place `usePerfMountTracker("GamePlayersListItem")` at the top of a component.
 */
export function usePerfMountTracker(name: string): void {
  useEffect(() => {
    if (!ENABLED) return;

    const count = (mountCounts.get(name) ?? 0) + 1;
    mountCounts.set(name, count);
    console.log(`[PERF] ${name} MOUNTED (${count} total)`);

    return () => {
      const newCount = (mountCounts.get(name) ?? 1) - 1;
      mountCounts.set(name, newCount);
      console.log(`[PERF] ${name} UNMOUNTED (${newCount} remaining)`);
    };
  }, [name]);
}

/**
 * Time a synchronous block. Returns the duration in ms.
 *
 * Usage:
 *   const ms = perfTime("fingerprint", () => createScoringFingerprint(game));
 */
export function perfTime<T>(
  label: string,
  fn: () => T,
): { result: T; ms: number } {
  if (!ENABLED) {
    return { result: fn(), ms: 0 };
  }
  const start = performance.now();
  const result = fn();
  const ms = performance.now() - start;
  if (ms > 1) {
    console.log(`[PERF] ${label}: ${ms.toFixed(1)}ms`);
  }
  return { result, ms };
}

/**
 * Log when a value changes between renders. Useful for tracking
 * how often useMemo dependencies invalidate.
 *
 * Usage: `usePerfValueTracker("teamAssignments", teamAssignments)`
 */
export function usePerfValueTracker(name: string, value: unknown): void {
  const prev = useRef<unknown>(value);
  const changeCount = useRef(0);

  if (ENABLED && prev.current !== value) {
    changeCount.current += 1;
    console.log(`[PERF] ${name} CHANGED (${changeCount.current} times)`);
    prev.current = value;
  }
}

/**
 * Print a summary of all tracked mount counts and render counts.
 * Call from a dev menu or console.
 */
export function perfSummary(): void {
  if (!ENABLED) return;
  console.log("[PERF] === Mount Counts ===");
  for (const [name, count] of mountCounts) {
    console.log(`  ${name}: ${count} mounted`);
  }
  console.log("[PERF] === Render Counts ===");
  for (const [name, count] of renderCounts) {
    console.log(`  ${name}: ${count} total renders`);
  }
}
