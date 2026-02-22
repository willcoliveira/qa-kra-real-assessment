export const TIMEOUTS = {
  SHORT: 5_000, // Quick visibility checks
  MEDIUM: 10_000, // Standard interactions (waitForURL, waitFor)
  LONG: 15_000, // Slow-loading elements, auth flows
} as const
