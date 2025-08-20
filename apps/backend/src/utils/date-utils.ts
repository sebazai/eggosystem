import moment from "moment-timezone";

export const getSevenDaysLaterInMillis = () => {
  const now = new Date();
  const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  return sevenDaysLater.getTime();
};

export const getMonthDifference = (timestamp1: number, timestamp2: number) => {
  const date1 = new Date(timestamp1);
  const date2 = new Date(timestamp2);

  const yearsDiff = date2.getFullYear() - date1.getFullYear();
  const monthsDiff = date2.getMonth() - date1.getMonth();

  return yearsDiff * 12 + monthsDiff;
};

export const convertISOToTime = (isoString: string) => {
  return new Date(isoString).toISOString().slice(11, 19);
};

export const convertISOToFinnishTime = (isoString: string) => {
  const utcDate = moment(isoString);
  const finnishTime = utcDate
    .tz("Europe/Helsinki")
    .format("YYYY-MM-DD HH:mm:ss");
  return finnishTime;
};

export const generateYMD = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getNextWednesdayMatchTime = () => {
  const now = new Date();
  const nextWednesday = new Date(now);
  nextWednesday.setDate(now.getDate() + ((3 + 7 - now.getDay()) % 7));
  nextWednesday.setHours(19, 0, 0, 0);

  const match_date = nextWednesday.toISOString().slice(0, 10); // YYYY-MM-DD
  const start_time = nextWednesday
    ? new Date(nextWednesday).toISOString().slice(11, 19) // HH:MM:SS
    : "00:00:00";

  return { match_date, start_time };
};

export const getMatchDateTime = (scheduledAt?: number) => {
  if (scheduledAt) {
    const date = new Date(scheduledAt * 1000);
    const match_date = date.toISOString().slice(0, 10); // YYYY-MM-DD
    const start_time = date.toISOString().slice(11, 19); // HH:MM:SS
    return { match_date, start_time };
  }

  return getNextWednesdayMatchTime();
};

export const adjustMatchDateTime = (
  match_date: string,
  start_time: string,
  options: {
    hours?: number;
    minutes?: number;
    days?: number;
  } = {}
) => {
  const { hours = 0, minutes = 0, days = 0 } = options;

  // Create a date object from the match_date and start_time
  const dateTimeString = `${match_date}T${start_time}Z`;
  const date = new Date(dateTimeString);

  // Add the specified time
  date.setHours(date.getHours() + hours);
  date.setMinutes(date.getMinutes() + minutes);
  date.setDate(date.getDate() + days);

  // Extract the new date and time
  const new_match_date = date.toISOString().slice(0, 10); // YYYY-MM-DD
  const new_start_time = date.toISOString().slice(11, 19); // HH:MM:SS

  return { match_date: new_match_date, start_time: new_start_time };
};
