/**
 * Working days calculator for /titta.
 * Counts Mon–Fri between start and end, excluding vacation, Fiji public holidays,
 * 25 unmarked holidays (weekdays only), and 2 travelling days.
 */

/** Default end date: 26.8.2026 (YYYY-MM-DD). */
export const DEFAULT_END_DATE = "2026-08-26";

const VACATION_START = { year: 2026, month: 1, day: 9 }; // 9 Feb
const VACATION_END = { year: 2026, month: 1, day: 25 }; // 25 Feb

/** Fiji public holidays 2026 (weekdays only; Sat/Sun don't reduce working days). Jan 1 – Aug 31. */
const FIJI_PUBLIC_HOLIDAYS_2026: Array<{
  year: number;
  month: number;
  day: number;
}> = [
  { year: 2026, month: 0, day: 1 }, // New Year's Day, Thu
  { year: 2026, month: 3, day: 2 }, // Extra holiday, Thu
  { year: 2026, month: 3, day: 3 }, // Good Friday, Fri
  { year: 2026, month: 3, day: 6 }, // Easter Monday, Mon
  { year: 2026, month: 4, day: 15 }, // Girmit Day, Fri
  { year: 2026, month: 4, day: 29 }, // Ratu Sir Lala Sukuna Day, Fri
  { year: 2026, month: 7, day: 24 } // Prophet Mohammed's Birthday, Mon
];

const UNMARKED_HOLIDAYS = 25;
const TRAVELLING_DAYS = 2;

function toDateKey(d: { year: number; month: number; day: number }): string {
  return `${d.year}-${String(d.month + 1).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`;
}

function dateFromYMD(y: number, m: number, d: number): Date {
  return new Date(y, m, d);
}

function isWeekday(date: Date): boolean {
  const day = date.getDay();
  return day >= 1 && day <= 5;
}

function isInRange(
  date: Date,
  start: { year: number; month: number; day: number },
  end: { year: number; month: number; day: number }
): boolean {
  const t = date.getTime();
  const startT = dateFromYMD(start.year, start.month, start.day).getTime();
  const endT = dateFromYMD(end.year, end.month, end.day).getTime();
  return t >= startT && t <= endT;
}

function isInVacation(date: Date): boolean {
  return isInRange(date, VACATION_START, VACATION_END);
}

function isFijiHoliday(date: Date): boolean {
  const key = toDateKey({
    year: date.getFullYear(),
    month: date.getMonth(),
    day: date.getDate()
  });
  return FIJI_PUBLIC_HOLIDAYS_2026.some(
    (h) => toDateKey({ year: h.year, month: h.month, day: h.day }) === key
  );
}

export interface WorkingDaysResult {
  /** Start date used */
  startDate: string;
  /** End date used (default 26.8.2026) */
  endDate: string;
  /** Weekdays in range before any deductions */
  weekdaysInRange: number;
  /** Days excluded due to vacation (9.2.–25.2.) */
  vacationDaysExcluded: number;
  /** Days excluded due to Fiji public holidays (weekdays only) */
  fijiHolidaysExcluded: number;
  /** Unmarked holidays (25, weekdays only) */
  unmarkedHolidays: number;
  /** Travelling days (2) */
  travellingDays: number;
  /** Final working days */
  workingDays: number;
  /** Complete work weeks (floor of workingDays / 5) */
  completeWorkWeeks: number;
}

/**
 * Resolve end date: use given string if valid YYYY-MM-DD, otherwise default 26.8.2026.
 */
function resolveEndDate(endDateStr: string | undefined): string {
  if (endDateStr && /^\d{4}-\d{2}-\d{2}$/.test(endDateStr)) return endDateStr;
  return DEFAULT_END_DATE;
}

/**
 * Compute working days from startDate (YYYY-MM-DD) to endDate (inclusive).
 * If endDate is not provided or invalid, uses 26.8.2026.
 * Excludes: weekends, vacation 9.2.–25.2., Fiji public holidays (weekdays),
 * 25 unmarked holidays, 2 travelling days.
 */
export function calculateWorkingDays(
  startDateStr: string,
  endDateStr?: string
): WorkingDaysResult {
  const endDate = resolveEndDate(endDateStr);
  const parts = startDateStr.split("-").map(Number);
  const y = parts[0];
  const m = parts[1];
  const d = parts[2];
  if (
    y === undefined ||
    m === undefined ||
    d === undefined ||
    isNaN(y) ||
    isNaN(m) ||
    isNaN(d)
  ) {
    return {
      startDate: startDateStr,
      endDate,
      weekdaysInRange: 0,
      vacationDaysExcluded: 0,
      fijiHolidaysExcluded: 0,
      unmarkedHolidays: UNMARKED_HOLIDAYS,
      travellingDays: TRAVELLING_DAYS,
      workingDays: 0,
      completeWorkWeeks: 0
    };
  }
  const endParts = endDate.split("-").map(Number);
  const ey = endParts[0];
  const em = endParts[1];
  const ed = endParts[2];
  if (
    ey === undefined ||
    em === undefined ||
    ed === undefined ||
    isNaN(ey) ||
    isNaN(em) ||
    isNaN(ed)
  ) {
    return {
      startDate: startDateStr,
      endDate,
      weekdaysInRange: 0,
      vacationDaysExcluded: 0,
      fijiHolidaysExcluded: 0,
      unmarkedHolidays: UNMARKED_HOLIDAYS,
      travellingDays: TRAVELLING_DAYS,
      workingDays: 0,
      completeWorkWeeks: 0
    };
  }
  const start = dateFromYMD(y, m - 1, d);
  const end = dateFromYMD(ey, em - 1, ed);

  if (start.getTime() > end.getTime()) {
    return {
      startDate: startDateStr,
      endDate,
      weekdaysInRange: 0,
      vacationDaysExcluded: 0,
      fijiHolidaysExcluded: 0,
      unmarkedHolidays: UNMARKED_HOLIDAYS,
      travellingDays: TRAVELLING_DAYS,
      workingDays: 0,
      completeWorkWeeks: 0
    };
  }

  let weekdaysInRange = 0;
  let vacationDaysExcluded = 0;
  let fijiHolidaysExcluded = 0;

  const current = new Date(start.getTime());
  const endTime = end.getTime();

  while (current.getTime() <= endTime) {
    if (!isWeekday(current)) {
      current.setDate(current.getDate() + 1);
      continue;
    }
    weekdaysInRange += 1;
    if (isInVacation(current)) vacationDaysExcluded += 1;
    else if (isFijiHoliday(current)) fijiHolidaysExcluded += 1;
    current.setDate(current.getDate() + 1);
  }

  const workingDays = Math.max(
    0,
    weekdaysInRange -
      vacationDaysExcluded -
      fijiHolidaysExcluded -
      UNMARKED_HOLIDAYS -
      TRAVELLING_DAYS
  );

  const completeWorkWeeks = Math.floor(workingDays / 5);

  return {
    startDate: startDateStr,
    endDate,
    weekdaysInRange,
    vacationDaysExcluded,
    fijiHolidaysExcluded,
    unmarkedHolidays: UNMARKED_HOLIDAYS,
    travellingDays: TRAVELLING_DAYS,
    workingDays,
    completeWorkWeeks
  };
}

/** Default start date for the calculator (today in YYYY-MM-DD). */
export function getDefaultStartDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
