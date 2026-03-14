/**
 * Stale Times (milliseconds)
 * Data is considered fresh for this duration
 */
export const STALE_TIME = {
  instant: 0, // Always refetch (real-time data)
  short: 30 * 1000, // 30 seconds - frequently changing data
  medium: 5 * 60 * 1000, // 5 minutes - default for most queries
  long: 15 * 60 * 1000, // 15 minutes - stable data
  veryLong: 60 * 60 * 1000, // 1 hour - rarely changing data
} as const;
