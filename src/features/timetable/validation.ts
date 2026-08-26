import type { LunchAllocation, Person, TimetableEntry } from "@/domain/timetable/types";
import { vacantPosts } from "@/db/seed-data";

export type ValidationIssue = {
  code: string;
  severity: "INFO" | "WARNING" | "ACTION_REQUIRED";
  message: string;
};

export function getFirstRunValidation(params: {
  people: Person[];
  timetableEntries: TimetableEntry[];
  lunchAllocations: LunchAllocation[];
}): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const post of vacantPosts) {
    issues.push({
      code: `vacant-${post.id}`,
      severity: "ACTION_REQUIRED",
      message: `${post.name} is vacant; timetable may exist before a person is appointed.`,
    });
  }

  for (const person of params.people) {
    if (person.registrationGroupId === null) {
      issues.push({
        code: `registration-${person.id}`,
        severity: "INFO",
        message: `${person.displayName} has explicitly no registration group and may be considered for registration cover.`,
      });
    }
  }

  for (const entry of params.timetableEntries) {
    if (entry.status === "UNCLASSIFIED" || entry.ambiguous) {
      issues.push({
        code: `entry-${entry.id}`,
        severity: "ACTION_REQUIRED",
        message: `Unclassified or ambiguous timetable entry: ${entry.sourceText ?? entry.id}`,
      });
    }
  }

  const specialistIds = params.people.filter((person) => person.roleType === "SPECIALIST_TEACHER").map((person) => person.id);
  for (const personId of specialistIds) {
    const hasLunch = params.lunchAllocations.some((allocation) => allocation.personId === personId);
    if (!hasLunch) {
      issues.push({
        code: `specialist-lunch-${personId}`,
        severity: "ACTION_REQUIRED",
        message: `${personId} needs an explicit 6A/6B lunch allocation before operational use.`,
      });
    }
  }

  return issues;
}
