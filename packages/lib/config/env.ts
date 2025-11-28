/**
 * Environment configuration
 * This file provides environment variables in a way that works across
 * React Native (process.env) and Web (import.meta.env)
 */

// Get JAZZ_WORKER_ACCOUNT from environment
// React Native: process.env.JAZZ_WORKER_ACCOUNT
// Web: Will be replaced at build time by Vite
export const JAZZ_WORKER_ACCOUNT =
  typeof process !== "undefined" ? process.env.JAZZ_WORKER_ACCOUNT : undefined;
