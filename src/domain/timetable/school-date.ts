import type { SchoolDay } from "@/domain/timetable/types";

const formatter = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  timeZone: "Asia/Riyadh",
});

const dayMap: Record<string, SchoolDay | null> = {
  Sunday: "SUNDAY",
  Monday: "MONDAY",
  Tuesday: "TUESDAY",
  Wednesday: "WEDNESDAY",
  Thursday: "THURSDAY",
  Friday: null,
  Saturday: null,
};

export function getRiyadhSchoolDay(input: string | Date): SchoolDay | null {
  const date = typeof input === "string" ? new Date(`${input}T12:00:00+03:00`) : input;
  return dayMap[formatter.format(date)] ?? null;
}

export function formatRiyadhDate(input: string | Date) {
  const date = typeof input === "string" ? new Date(`${input}T12:00:00+03:00`) : input;
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Riyadh",
  }).format(date);
}
