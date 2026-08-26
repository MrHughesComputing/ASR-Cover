import type { SchoolDay, SchoolPeriod, TimetableEntry, TeachingEvent } from "@/domain/timetable/types";

export type CoverRequirement = {
  id: string;
  day: SchoolDay;
  period: SchoolPeriod;
  entry: TimetableEntry;
  teachingEvent?: TeachingEvent;
  coverNeeded: boolean;
  reason: string;
};

export function getCoverRequirementsForPerson(params: {
  personId: string;
  day: SchoolDay;
  periods: SchoolPeriod[];
  entries: TimetableEntry[];
  teachingEvents: TeachingEvent[];
}): CoverRequirement[] {
  return params.entries
    .filter((entry) => entry.personId === params.personId && entry.day === params.day)
    .map((entry) => {
      const period = params.periods.find((candidate) => candidate.id === entry.periodId);
      if (!period) throw new Error(`Unknown period ${entry.periodId}`);
      const teachingEvent = params.teachingEvents.find((event) => event.id === entry.teachingEventId);
      const coverNeeded = entry.status === "TEACHING" || entry.status === "REGISTRATION" || entry.status === "CCA";
      return {
        id: `${entry.id}-requirement`,
        day: params.day,
        period,
        entry,
        teachingEvent,
        coverNeeded,
        reason: coverNeeded ? "Teaching or supervision commitment requires cover" : `${entry.status} does not require cover`,
      };
    })
    .sort((a, b) => a.period.dayOrder - b.period.dayOrder);
}
