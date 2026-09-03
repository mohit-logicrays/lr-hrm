import { prisma } from "../config/prisma";

export function getWorkDaysPerWeek(): number {
  const envVal = parseInt(process.env.WORKING_DAYS_PER_WEEK || process.env.WORKING_DAYS || "5", 10);
  if (isNaN(envVal) || envVal < 1) return 5;
  if (envVal > 6) return 6;
  return envVal;
}

function normalizeDate(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * Checks if the given date is the LAST Saturday of its month.
 */
export function isLastSaturdayOfMonth(d: Date): boolean {
  if (d.getDay() !== 6) return false;
  // If adding 7 days moves us to the next month, then this is the last Saturday.
  const nextWeek = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7);
  return nextWeek.getMonth() !== d.getMonth();
}

/**
 * Determines whether a given date is a working day based on:
 * 1. Sunday (day 0) is ALWAYS a non-working day.
 * 2. Days Mon (1) to Fri (5) are regular working days (based on workDaysPerWeek >= 1..5).
 * 3. Saturday (day 6):
 *    - The LAST Saturday of the month is ALWAYS a working day.
 *    - If workDaysPerWeek is 6, all Saturdays are working days.
 *    - Otherwise, other Saturdays (1st, 2nd, 3rd, 4th) are non-working days.
 * 4. Company & National Holidays (non-optional) are non-working days.
 */
export function isWorkingDay(
  date: Date,
  workDaysPerWeek = getWorkDaysPerWeek(),
  holidaySet?: Set<string>
): boolean {
  const dayOfWeek = date.getDay();
  const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

  // 1. Mandatory holiday check
  if (holidaySet && holidaySet.has(dateKey)) {
    return false;
  }

  // 2. Sunday is never a working day
  if (dayOfWeek === 0) {
    return false;
  }

  // 3. Saturday rules
  if (dayOfWeek === 6) {
    // Last Saturday of every month is ALWAYS working
    if (isLastSaturdayOfMonth(date)) {
      return true;
    }
    // If working days per week is 6, all Saturdays are working days
    if (workDaysPerWeek >= 6) {
      return true;
    }
    // Otherwise regular Saturdays are off
    return false;
  }

  // 4. Weekdays (1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri)
  return dayOfWeek <= workDaysPerWeek;
}

/**
 * Calculates net working days between start and end date (inclusive),
 * honoring:
 * - Dynamic WORKING_DAYS_PER_WEEK from environment (range 1-6, default 5)
 * - Last Saturday of the month is ALWAYS working
 * - Non-optional Company/National Holidays excluded
 */
export async function calculateNetWorkingDays(start: Date, end: Date): Promise<number> {
  const normStart = normalizeDate(start);
  const normEnd = normalizeDate(end);
  if (normEnd < normStart) return 0;

  const workDaysPerWeek = getWorkDaysPerWeek();

  // Fetch holidays within range (non-deleted, mandatory)
  const holidays = await prisma.holiday.findMany({
    where: {
      deletedAt: null,
      isOptional: false,
      date: {
        gte: new Date(normStart.getFullYear(), normStart.getMonth(), normStart.getDate(), 0, 0, 0),
        lte: new Date(normEnd.getFullYear(), normEnd.getMonth(), normEnd.getDate(), 23, 59, 59),
      },
    },
    select: { date: true },
  });

  const holidayDateSet = new Set(
    holidays.map((h) => {
      const hd = new Date(h.date);
      return `${hd.getFullYear()}-${String(hd.getMonth() + 1).padStart(2, "0")}-${String(hd.getDate()).padStart(2, "0")}`;
    })
  );

  let count = 0;
  const cur = new Date(normStart);
  while (cur <= normEnd) {
    if (isWorkingDay(cur, workDaysPerWeek, holidayDateSet)) {
      count++;
    }
    cur.setDate(cur.getDate() + 1);
  }

  return count;
}
