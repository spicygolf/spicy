import { zonedTimeToUtc } from 'date-fns-tz';


export const getUTCTimeISO = (time: Date | null) => {
  if (!time) {
    return '';
  }
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return zonedTimeToUtc(time, timezone).toISOString();
};

export const getUTCNowISO = () => getUTCTimeISO(new Date());
