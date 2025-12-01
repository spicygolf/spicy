/**
 * Environment configuration
 * This file provides environment variables in a way that works across
 * React Native (process.env) and Web (import.meta.env)
 */

// Get JAZZ_WORKER_ACCOUNT from environment
// React Native: Set via setJazzWorkerAccount() after fetching from API
// Web: Will be replaced at build time by Vite
let _jazzWorkerAccount: string | undefined =
  typeof process !== "undefined" ? process.env.JAZZ_WORKER_ACCOUNT : undefined;

export const JAZZ_WORKER_ACCOUNT = () => _jazzWorkerAccount;

export function setJazzWorkerAccount(account: string): void {
  _jazzWorkerAccount = account;
}
