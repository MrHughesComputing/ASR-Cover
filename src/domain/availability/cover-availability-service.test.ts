import assert from "node:assert/strict";
import { CoverAvailabilityService } from "./cover-availability-service";
import type { CoverContext, Person, SchoolPeriod, TimetableEntry } from "../timetable/types";

const periods: SchoolPeriod[] = [
  { id: "REG", label: "Registration", dayOrder: 0, startTime: "07:30", endTime: "07:55", coverRelevant: true },
  { id: "L1", label: "Lesson 1", dayOrder: 1, startTime: "07:55", endTime: "08:40", coverRelevant: true },
  { id: "L2", label: "Lesson 2", dayOrder: 2, startTime: "08:40", endTime: "09:25", coverRelevant: true },
  { id: "L5", label: "Lesson 5", dayOrder: 6, startTime: "11:15", endTime: "12:00", coverRelevant: true },
  { id: "L6A", label: "Lesson 6A", dayOrder: 7, startTime: "12:00", endTime: "12:45", coverRelevant: true },
  { id: "L6B", label: "Lesson 6B", dayOrder: 8, startTime: "12:45", endTime: "13:30", coverRelevant: true },
  { id: "CCA", label: "CCA", dayOrder: 11, startTime: "15:05", endTime: "16:00", coverRelevant: true },
];
const people: Person[] = [
  { id: "absent", firstName: "Absent", lastName: "Teacher", displayName: "Absent Teacher", active: true, phase: "SECONDARY", roleType: "SECONDARY_TEACHER", subjects: ["Computing"], coverEligible: true, coverPriority: "NORMAL", registrationGroupId: null },
  { id: "eyfs", firstName: "EYFS", lastName: "Fixture", displayName: "EYFS Fixture", active: true, phase: "EYFS", roleType: "EYFS_CLASS_TEACHER", subjects: ["EYFS"], coverEligible: true, coverPriority: "NORMAL", registrationGroupId: "EYFS-A" },
  { id: "primary", firstName: "Primary", lastName: "Fixture", displayName: "Primary Fixture", active: true, phase: "PRIMARY", roleType: "PRIMARY_CLASS_TEACHER", subjects: ["Primary"], coverEligible: true, coverPriority: "NORMAL", registrationGroupId: "Y5-A" },
  { id: "specialist", firstName: "Specialist", lastName: "Fixture", displayName: "Specialist Fixture", active: true, phase: "SECONDARY", roleType: "SPECIALIST_TEACHER", subjects: ["Computing"], coverEligible: true, coverPriority: "NORMAL", registrationGroupId: null },
  { id: "meeting", firstName: "Meeting", lastName: "Fixture", displayName: "Meeting Fixture", active: true, phase: "SECONDARY", roleType: "LEADERSHIP", subjects: ["Maths"], coverEligible: true, coverPriority: "LOW", registrationGroupId: "7B" },
  { id: "free", firstName: "Free", lastName: "Fixture", displayName: "Free Fixture", active: true, phase: "SECONDARY", roleType: "SECONDARY_TEACHER", subjects: ["Computing"], coverEligible: true, coverPriority: "NORMAL", registrationGroupId: null },
  { id: "high-load", firstName: "High", lastName: "Load", displayName: "High Load", active: true, phase: "SECONDARY", roleType: "SECONDARY_TEACHER", subjects: ["Computing"], coverEligible: true, coverPriority: "NORMAL", registrationGroupId: null },
];
const entries: TimetableEntry[] = [
  { id: "absent-l1", day: "WEDNESDAY", periodId: "L1", personId: "absent", subject: "Computing", classCodes: ["Year 9A"], status: "TEACHING" },
  { id: "meeting-reg", day: "WEDNESDAY", periodId: "REG", personId: "meeting", classCodes: ["7B"], status: "REGISTRATION" },
  { id: "meeting-cca", day: "WEDNESDAY", periodId: "CCA", personId: "meeting", classCodes: [], commitmentCode: "SLT", status: "MEETING" },
  { id: "specialist-l6a", day: "WEDNESDAY", periodId: "L6A", personId: "specialist", subject: "Computing", classCodes: ["Year 7A"], status: "TEACHING" },
];
const service = new CoverAvailabilityService();
function context(periodId: string, overrides: Partial<CoverContext> = {}): CoverContext {
  return {
    date: "2026-08-26",
    day: "WEDNESDAY",
    period: periods.find((period) => period.id === periodId)!,
    absentPersonId: "absent",
    targetTeachingEvent: { id: "event", subject: "Computing", classCodes: ["Year 9A"], yearGroup: "9", assignedPersonIds: ["absent"] },
    people,
    timetableEntries: entries,
    lunchAllocations: [
      { personId: "eyfs", day: "WEDNESDAY", periodId: "L5", source: "ROLE_RULE", notes: "EYFS working lunch" },
      { personId: "primary", day: "WEDNESDAY", periodId: "L6A", source: "ROLE_RULE", notes: "Primary lunch starts 12:00" },
      { personId: "primary", day: "WEDNESDAY", periodId: "L6B", source: "ROLE_RULE", notes: "Primary lunch protected until 13:00" },
      { personId: "specialist", day: "WEDNESDAY", periodId: "L6B", source: "SPECIALIST_RULE", notes: "Teaches L6A; L6B allocated lunch" },
    ],
    commitmentCodes: [{ code: "SLT", label: "SLT meeting", category: "MEETING", coverEligible: false, protected: true }],
    existingCover: [],
    absences: [{ personId: "absent", periodIds: ["L1"] }],
    coverLoads: { absent: { today: 0, week: 0, term: 0, minutes: 0 }, eyfs: { today: 0, week: 0, term: 0, minutes: 0 }, primary: { today: 0, week: 0, term: 0, minutes: 0 }, specialist: { today: 0, week: 0, term: 0, minutes: 0 }, meeting: { today: 0, week: 0, term: 0, minutes: 0 }, free: { today: 0, week: 0, term: 0, minutes: 0 }, "high-load": { today: 2, week: 6, term: 20, minutes: 900 } },
    ...overrides,
  };
}
function result(personId: string, ctx: CoverContext) {
  const value = service.getAvailability(ctx).find((candidate) => candidate.personId === personId);
  if (!value) throw new Error(`Missing ${personId}`);
  return value;
}
assert.equal(result("eyfs", context("L5")).status, "LUNCH");
assert.equal(result("primary", context("L6A")).status, "LUNCH");
assert.equal(result("specialist", context("L6B", { absentPersonId: "none", absences: [] })).status, "LUNCH");
assert.equal(result("meeting", context("CCA", { absentPersonId: "none", absences: [] })).status, "MEETING");
assert.equal(result("meeting", context("REG", { absentPersonId: "none", absences: [] })).status, "REGISTRATION");
assert.equal(result("free", context("REG", { absentPersonId: "none", absences: [] })).status, "UNCLASSIFIED");
assert.equal(result("meeting", context("L2", { existingCover: [{ absentPersonId: "x", coveringPersonId: "meeting", date: "2026-08-26", day: "WEDNESDAY", periodId: "L2", status: "COVERED" }] })).status, "ALREADY_COVERING");
assert.equal(result("absent", context("L1")).status, "ABSENT");
const ranked = service.getAvailability(context("L2", { people: [people[5], people[6]], timetableEntries: [{ id: "free-l2", day: "WEDNESDAY", periodId: "L2", personId: "free", classCodes: [], status: "AVAILABLE" }, { id: "high-l2", day: "WEDNESDAY", periodId: "L2", personId: "high-load", classCodes: [], status: "AVAILABLE" }] }));
assert.equal(ranked[0].personId, "free");
console.log("PASS cover availability isolated fixture tests");
