import type {
  CoverContext,
  CoverLoad,
  CoverPriority,
  Person,
  TimetableEntry,
  TimetableStatus,
} from "@/domain/timetable/types";

export type AvailabilityResult = {
  personId: string;
  displayName: string;
  eligible: boolean;
  score: number;
  status: TimetableStatus | "ABSENT" | "ALREADY_COVERING" | "INACTIVE" | "NOT_COVER_ELIGIBLE";
  reasons: string[];
};

const hardUnavailableStatuses = new Set<TimetableStatus>([
  "TEACHING",
  "REGISTRATION",
  "LUNCH",
  "MEETING",
  "PPA",
  "PROTECTED",
  "CCA",
  "OTHER_COMMITMENT",
  "UNCLASSIFIED",
]);

const priorityAdjustments: Record<CoverPriority, number> = {
  HIGH: 12,
  NORMAL: 0,
  LOW: -16,
  EMERGENCY_ONLY: -35,
  EXEMPT: -100,
};

export class CoverAvailabilityService {
  getAvailability(context: CoverContext): AvailabilityResult[] {
    return context.people
      .map((person) => this.evaluatePerson(person, context))
      .sort((a, b) => {
        if (a.eligible !== b.eligible) return a.eligible ? -1 : 1;
        return b.score - a.score || a.displayName.localeCompare(b.displayName);
      });
  }

  private evaluatePerson(person: Person, context: CoverContext): AvailabilityResult {
    const reasons: string[] = [];
    const base = this.baseResult(person, reasons);

    if (!person.active) {
      return { ...base, eligible: false, status: "INACTIVE", reasons: ["Inactive staff member"] };
    }

    if (!person.coverEligible || person.coverPriority === "EXEMPT") {
      return { ...base, eligible: false, status: "NOT_COVER_ELIGIBLE", reasons: ["Not cover eligible"] };
    }

    if (person.id === context.absentPersonId || context.absences.some((absence) => absence.personId === person.id && absence.periodIds.includes(context.period.id))) {
      return { ...base, eligible: false, status: "ABSENT", reasons: ["Absent at this time"] };
    }

    if (context.existingCover.some((cover) => cover.coveringPersonId === person.id && cover.periodId === context.period.id && cover.status === "COVERED")) {
      return { ...base, eligible: false, status: "ALREADY_COVERING", reasons: ["Already covering another class"] };
    }

    const entry = this.entryFor(person.id, context);
    const lunch = context.lunchAllocations.find(
      (allocation) => allocation.personId === person.id && allocation.day === context.day && allocation.periodId === context.period.id,
    );

    if (lunch) {
      return { ...base, eligible: false, status: "LUNCH", reasons: [lunch.notes ?? "Allocated lunch"] };
    }

    if (entry) {
      const protectedCode = entry.commitmentCode
        ? context.commitmentCodes.find((code) => code.code === entry.commitmentCode)
        : undefined;

      if (entry.status === "MEETING" || protectedCode?.protected) {
        return {
          ...base,
          eligible: false,
          status: "MEETING",
          reasons: [protectedCode?.label ?? entry.sourceText ?? "Protected meeting"],
        };
      }

      if (hardUnavailableStatuses.has(entry.status)) {
        return {
          ...base,
          eligible: false,
          status: entry.status,
          reasons: [this.describeEntry(entry)],
        };
      }
    }

    const score = this.scorePerson(person, context.coverLoads[person.id], context);
    return {
      ...base,
      eligible: true,
      score,
      status: "AVAILABLE",
      reasons: [
        entry?.status === "AVAILABLE" ? "Explicitly marked available" : "No teaching commitment",
        "Not allocated lunch",
        "No protected meeting",
        `${context.coverLoads[person.id]?.week ?? 0} cover(s) assigned this week`,
      ],
    };
  }

  private baseResult(person: Person, reasons: string[]): AvailabilityResult {
    return {
      personId: person.id,
      displayName: person.displayName,
      eligible: true,
      score: 0,
      status: "AVAILABLE",
      reasons,
    };
  }

  private entryFor(personId: string, context: CoverContext): TimetableEntry | undefined {
    return context.timetableEntries.find(
      (entry) => entry.personId === personId && entry.day === context.day && entry.periodId === context.period.id,
    );
  }

  private describeEntry(entry: TimetableEntry): string {
    if (entry.status === "TEACHING") {
      const classText = entry.classCodes.length ? ` ${entry.classCodes.join(", ")}` : "";
      return `Teaching${classText}${entry.subject ? ` ${entry.subject}` : ""}`.trim();
    }

    if (entry.status === "REGISTRATION") return "Own registration group";
    if (entry.status === "PPA") return "Protected PPA";
    if (entry.status === "UNCLASSIFIED") return "Unclassified timetable slot";
    return entry.sourceText ?? entry.status.replaceAll("_", " ").toLowerCase();
  }

  private scorePerson(person: Person, load: CoverLoad | undefined, context: CoverContext): number {
    const safeLoad = load ?? { today: 0, week: 0, term: 0, minutes: 0 };
    let score = 70;

    score += priorityAdjustments[person.coverPriority];
    score -= safeLoad.today * 12;
    score -= safeLoad.week * 5;
    score -= safeLoad.term * 2;

    if (context.targetTeachingEvent) {
      if (context.targetTeachingEvent.subject && person.subjects.includes(context.targetTeachingEvent.subject)) score += 10;
      if (context.targetTeachingEvent.yearGroup) {
        const targetPhase = Number(context.targetTeachingEvent.yearGroup) <= 6 ? "PRIMARY" : "SECONDARY";
        if (person.phase === targetPhase || person.phase === "CROSS_PHASE") score += 8;
        else score -= 10;
      }
    }

    if (person.roleType === "LEADERSHIP") score -= 18;
    if (person.exemptFromNormalCover) score -= 45;

    return Math.max(0, Math.min(100, score));
  }
}
