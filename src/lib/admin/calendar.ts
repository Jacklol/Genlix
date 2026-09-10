/** Date-only helpers: UTC arithmetic prevents DST and time-zone shifts. */
function utcDate(year: number, month: number, day: number) {
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day);
  return date;
}

function toIso(date: Date): string {
  const year = date.getUTCFullYear();
  if (year < 1 || year > 9999) return "";
  return `${String(year).padStart(4, "0")}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

export function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  return toIso(utcDate(year, month, day)) === value;
}

export function parseCalendarInput(value: string): string {
  const trimmed = value.trim();
  if (isCalendarDate(trimmed)) return trimmed;
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(trimmed);
  if (!match) return "";
  const iso = `${match[3]}-${match[2]}-${match[1]}`;
  return isCalendarDate(iso) ? iso : "";
}

export function formatCalendarInput(value: string): string {
  if (!isCalendarDate(value)) return "";
  const [year, month, day] = value.split("-");
  return `${day}.${month}.${year}`;
}

export function localToday(): string {
  const now = new Date();
  return toIso(utcDate(now.getFullYear(), now.getMonth() + 1, now.getDate()));
}

export function calendarMonth(value: string): string {
  return `${value.slice(0, 7)}-01`;
}

export function moveCalendarDay(value: string, amount: number): string {
  const [year, month, day] = value.split("-").map(Number);
  return toIso(utcDate(year, month, day + amount)) || value;
}

export function moveCalendarMonth(value: string, amount: number): string {
  const [year, month, day] = value.split("-").map(Number);
  const first = utcDate(year, month + amount, 1);
  if (!toIso(first)) return value;
  const lastDay = utcDate(first.getUTCFullYear(), first.getUTCMonth() + 2, 0).getUTCDate();
  first.setUTCDate(Math.min(day, lastDay));
  return toIso(first);
}

export function calendarWeekday(value: string): number {
  const [year, month, day] = value.split("-").map(Number);
  return (utcDate(year, month, day).getUTCDay() + 6) % 7;
}

export function calendarDays(monthStart: string) {
  const [year, month] = monthStart.split("-").map(Number);
  const offset = calendarWeekday(calendarMonth(monthStart));
  return Array.from({ length: 42 }, (_, index) => {
    const date = utcDate(year, month, 1 - offset + index);
    return { iso: toIso(date), day: date.getUTCDate(), inMonth: date.getUTCMonth() === month - 1 };
  });
}

export function calendarDayLabel(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(utcDate(year, month, day));
}
