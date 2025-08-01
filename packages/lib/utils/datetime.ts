import { fromZonedTime, toZonedTime } from "date-fns-tz";

export const getUTCTimeISO = (time: Date | null) => {
  if (!time) {
    return "";
  }
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return fromZonedTime(time, timezone).toISOString();
};

export const getUTCNowISO = () => getUTCTimeISO(new Date());

/**
 * Calculate milliseconds until the next occurrence of a target time in a specific timezone
 * @param hours - Target hour (0-23)
 * @param minutes - Target minutes (0-59)
 * @param seconds - Target seconds (0-59)
 * @param milliseconds - Target milliseconds (0-999)
 * @param timezone - Target timezone (e.g., 'America/New_York', 'UTC')
 * @returns Milliseconds until the next occurrence of the target time
 */
export const getMillisecondsUntilTargetTime = (
  hours: number,
  minutes: number = 0,
  seconds: number = 0,
  milliseconds: number = 0,
  timezone: string = "UTC",
): number => {
  const now = new Date();

  // Get current time in the target timezone
  const nowInTimezone = toZonedTime(now, timezone);

  // Create target time for today in the target timezone
  const targetInTimezone = new Date(nowInTimezone);
  targetInTimezone.setHours(hours, minutes, seconds, milliseconds);

  // If target time has already passed today, move to tomorrow
  if (nowInTimezone >= targetInTimezone) {
    targetInTimezone.setDate(targetInTimezone.getDate() + 1);
  }

  // Convert target time back to UTC
  const targetUTC = fromZonedTime(targetInTimezone, timezone);

  // Return milliseconds until target time
  return Math.max(0, targetUTC.getTime() - now.getTime());
};
