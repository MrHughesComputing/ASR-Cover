export const schoolDays = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY"] as const;
export type SchoolDay = (typeof schoolDays)[number];

export const timetableStatuses = [
  "TEACHING",
  "REGISTRATION",
  "AVAILABLE",
  "LUNCH",
  "MEETING",
  "PPA",
  "PROTECTED",
  "CCA",
  "OTHER_COMMITMENT",
  "UNCLASSIFIED",
] as const;
export type TimetableStatus = (typeof timetableStatuses)[number];

export type Phase = "EYFS" | "PRIMARY" | "SECONDARY" | "CROSS_PHASE";

export type RoleType =
  | "EYFS_CLASS_TEACHER"
  | "PRIMARY_CLASS_TEACHER"
  | "SPECIALIST_TEACHER"
  | "SECONDARY_TEACHER"
  | "LEADERSHIP"
  | "SUPPORT"
  | "OTHER";

export type CoverPriority = "HIGH" | "NORMAL" | "LOW" | "EMERGENCY_ONLY" | "EXEMPT";

export type SchoolPeriod = {
  id: string;
  label: string;
  dayOrder: number;
  startTime: string;
  endTime: string;
  coverRelevant: boolean;
};

export type Person = {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  active: boolean;
  phase: Phase;
  roleType: RoleType;
  subjects: string[];
  coverEligible: boolean;
  coverPriority: CoverPriority;
  exemptFromNormalCover?: boolean;
  registrationGroupId?: string | null;
};

export type CommitmentCode = {
  code: string;
  label: string;
  category: TimetableStatus;
  coverEligible: boolean;
  protected: boolean;
};

export type TeachingEvent = {
  id: string;
  subject: string;
  classCodes: string[];
  yearGroup?: string;
  groupCode?: string;
  room?: string;
  assignedPersonIds: string[];
};

export type TimetableEntry = {
  id: string;
  day: SchoolDay;
  periodId: string;
  personId?: string;
  postId?: string;
  teachingEventId?: string;
  subject?: string;
  classCodes: string[];
  groupCode?: string;
  room?: string;
  commitmentCode?: string;
  status: TimetableStatus;
  sourceText?: string;
  ambiguous?: boolean;
};

export type LunchAllocation = {
  personId: string;
  day: SchoolDay;
  periodId: string;
  source: "ROLE_RULE" | "SPECIALIST_RULE" | "ADMIN";
  notes?: string;
};

export type CoverAssignmentSnapshot = {
  absentPersonId: string;
  coveringPersonId?: string;
  date: string;
  day: SchoolDay;
  periodId: string;
  teachingEventId?: string;
  status: "COVERED" | "UNCOVERED" | "NO_COVER_REQUIRED" | "CONFLICT";
};

export type CoverLoad = {
  today: number;
  week: number;
  term: number;
  minutes: number;
};

export type CoverContext = {
  date: string;
  day: SchoolDay;
  period: SchoolPeriod;
  absentPersonId?: string;
  targetTeachingEvent?: TeachingEvent;
  people: Person[];
  timetableEntries: TimetableEntry[];
  lunchAllocations: LunchAllocation[];
  commitmentCodes: CommitmentCode[];
  existingCover: CoverAssignmentSnapshot[];
  absences: { personId: string; periodIds: string[] }[];
  coverLoads: Record<string, CoverLoad>;
};
