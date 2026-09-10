import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { test } from "node:test";

const require = createRequire(import.meta.url);
const { createJiti } = createRequire(require.resolve("eslint/package.json"))("jiti");
const jiti = createJiti(import.meta.url, { fsCache: false });
const { isCalendarDate, parseCalendarInput, formatCalendarInput, calendarMonth, calendarDays, calendarWeekday, moveCalendarDay, moveCalendarMonth } = await jiti.import("../src/lib/admin/calendar.ts");

test("publication dates retain their ISO form value and Russian display format", () => {
  for (const iso of ["2026-07-18", "2024-02-29", "0001-01-01", "0099-12-31", "9999-12-31"]) {
    assert.equal(isCalendarDate(iso), true);
    assert.equal(parseCalendarInput(formatCalendarInput(iso)), iso);
    assert.equal(parseCalendarInput(iso), iso);
  }
  assert.equal(formatCalendarInput("2026-07-18"), "18.07.2026");
  assert.equal(parseCalendarInput(" 18.07.2026 "), "2026-07-18");
});

test("invalid dates are rejected rather than rolled over into another month", () => {
  for (const value of ["", " ", "31.04.2026", "29.02.2025", "32.07.2026", "00.12.2026", "12.13.2026", "2026-2-3", "2026-02-31", "0000-01-01", "10.01.10000", "text"]) {
    assert.equal(parseCalendarInput(value), "", value);
  }
  assert.equal(formatCalendarInput("2025-02-29"), "");
});

test("six-week grid starts on Monday and includes adjacent months", () => {
  const days = calendarDays("2026-07-01");
  assert.equal(days.length, 42);
  assert.equal(days[0].iso, "2026-06-29");
  assert.equal(days[41].iso, "2026-08-09");
  assert.equal(days.filter((day) => day.inMonth).length, 31);
  assert.equal(new Set(days.map((day) => day.iso)).size, 42);
  assert.equal(calendarWeekday(days[0].iso), 0);
  assert.equal(calendarWeekday(days[6].iso), 6);
  assert.equal(calendarMonth("2026-07-18"), "2026-07-01");
});

test("arrow keys cross month and year boundaries, including leap days", () => {
  assert.equal(moveCalendarDay("2024-02-28", 1), "2024-02-29");
  assert.equal(moveCalendarDay("2025-02-28", 1), "2025-03-01");
  assert.equal(moveCalendarDay("2025-12-31", 1), "2026-01-01");
  assert.equal(moveCalendarDay("2026-01-01", -1), "2025-12-31");
  assert.equal(moveCalendarDay("2026-07-18", -7), "2026-07-11");
});

test("month and year navigation clamp the day to the target month", () => {
  assert.equal(moveCalendarMonth("2026-01-31", 1), "2026-02-28");
  assert.equal(moveCalendarMonth("2024-01-31", 1), "2024-02-29");
  assert.equal(moveCalendarMonth("2024-02-29", 12), "2025-02-28");
  assert.equal(moveCalendarMonth("2026-01-31", -1), "2025-12-31");
  assert.equal(moveCalendarMonth("2026-07-18", -12), "2025-07-18");
});

test("supported year boundaries cannot overflow", () => {
  assert.equal(moveCalendarDay("0001-01-01", -1), "0001-01-01");
  assert.equal(moveCalendarMonth("0001-01-01", -1), "0001-01-01");
  assert.equal(moveCalendarDay("9999-12-31", 1), "9999-12-31");
  assert.equal(moveCalendarMonth("9999-12-31", 1), "9999-12-31");
  for (const day of [...calendarDays("0001-01-01"), ...calendarDays("9999-12-01")]) {
    if (day.iso) assert.equal(isCalendarDate(day.iso), true);
  }
});

test("calendar arithmetic is independent of local time zone and DST", () => {
  const original = process.env.TZ;
  try {
    for (const zone of ["Europe/Minsk", "America/New_York", "Pacific/Kiritimati", "Pacific/Honolulu"]) {
      process.env.TZ = zone;
      assert.equal(moveCalendarDay("2026-03-08", 1), "2026-03-09");
      assert.equal(moveCalendarDay("2026-11-01", -1), "2026-10-31");
      assert.equal(formatCalendarInput("2026-07-18"), "18.07.2026");
    }
  } finally {
    if (original === undefined) delete process.env.TZ; else process.env.TZ = original;
  }
});
