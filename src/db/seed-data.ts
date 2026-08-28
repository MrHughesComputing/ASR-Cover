import importedTimetableData from "@/db/imported-timetable-data";
import type {
  CommitmentCode,
  CoverAssignmentSnapshot,
  CoverLoad,
  LunchAllocation,
  Person,
  SchoolPeriod,
  TeachingEvent,
  TimetableEntry,
} from "@/domain/timetable/types";

type ImportedData = {
  schoolPeriods: SchoolPeriod[];
  commitmentCodes: CommitmentCode[];
  people: Person[];
  posts: Array<{
    id: string;
    name: string;
    status: "VACANT" | "ACTIVE" | "INACTIVE";
    phase: string;
    roleType: string;
    subject?: string;
    sourcePage?: number | null;
  }>;
  ignoredResources: Array<{ name: string; page: number; reason: string }>;
  teachingEvents: TeachingEvent[];
  timetableEntries: TimetableEntry[];
  lunchAllocations: LunchAllocation[];
  coverLoads: Record<string, CoverLoad>;
  summary: Record<string, unknown>;
  validationIssues: Array<{ severity: "ERROR" | "WARNING"; type: string; message: string }>;
};

const data = importedTimetableData as unknown as ImportedData;

export const schoolPeriods = data.schoolPeriods;
export const protectedCommitmentCodes = data.commitmentCodes;
export const people = data.people;
export const vacantPosts = data.posts;
export const ignoredResources = data.ignoredResources;
export const teachingEvents = data.teachingEvents;
export const timetableEntries = data.timetableEntries;
export const lunchAllocations = data.lunchAllocations;
export const coverLoads = data.coverLoads;
export const importSummary = data.summary;
export const validationIssues = data.validationIssues;
export const existingCover: CoverAssignmentSnapshot[] = [];

