import assert from "node:assert/strict";
import { CoverAvailabilityService } from "./cover-availability-service";
import type { CoverContext, Person, TimetableEntry } from "../timetable/types";
import {
  coverLoads,
  lunchAllocations,
  people,
  protectedCommitmentCodes,
  schoolPeriods,
  teachingEvents,
  timetableEntries,
} from "../../db/seed-data";

const service = new CoverAvailabilityService();
const tests: { name: string; run: () => void }[] = [];

function it(name: string, run: () => void) {
  tests.push({ name, run });
}

function contextFor(periodId: string, overrides: Partial<CoverContext> = {}): CoverContext {
  return {
    date: "2026-08-26",
    day: "TUESDAY",
    period: schoolPeriods.find((period) => period.id === periodId)!,
    absentPersonId: "paul-hughes",
    targetTeachingEvent: teachingEvents[0],
    people,
    timetableEntries,
    lunchAllocations,
    commitmentCodes: protectedCommitmentCodes,
    existingCover: [],
    absences: [{ personId: "paul-hughes", periodIds: ["L1", "L2", "L3", "L4"] }],
    coverLoads,
    ...overrides,
  };
}

function resultFor(personId: string, context: CoverContext) {
  const result = service.getAvailability(context).find((candidate) => candidate.personId === personId);
  if (!result) throw new Error(`Missing result for ${personId}`);
  return result;
}

it("prevents EYFS teachers from covering during EYFS working lunch", () => {
  const result = resultFor("eyfs-cover-example", contextFor("L5"));
  assert.equal(result.eligible, false);
  assert.equal(result.status, "LUNCH");
  assert.ok(result.reasons.includes("EYFS working lunch"));
});

it("prevents primary teachers from covering during protected primary lunch", () => {
  const result = resultFor("primary-cover-example", contextFor("L6A"));
  assert.equal(result.eligible, false);
  assert.equal(result.status, "LUNCH");
});

it("prevents a specialist from covering their configured 6B lunch", () => {
  const context = contextFor("L6B", { absentPersonId: "someone-else", absences: [] });
  const result = resultFor("paul-hughes", context);
  assert.equal(result.eligible, false);
  assert.equal(result.status, "LUNCH");
});

it("prevents staff with SLT and other protected meetings from being recommended", () => {
  const context = contextFor("CCA", { absentPersonId: "someone-else", absences: [] });
  const result = resultFor("hina-khan", context);
  assert.equal(result.eligible, false);
  assert.equal(result.status, "MEETING");
  assert.match(result.reasons[0], /SLT/);
});

it("prevents a teacher with registration from covering another registration", () => {
  const context = contextFor("REG", { absentPersonId: "someone-else", absences: [] });
  const result = resultFor("hina-khan", context);
  assert.equal(result.eligible, false);
  assert.equal(result.status, "REGISTRATION");
});

it("allows an eligible teacher with no registration to potentially cover registration", () => {
  const context = contextFor("REG", { absentPersonId: "someone-else", absences: [] });
  const result = resultFor("crispin-cole", context);
  assert.equal(result.eligible, true);
  assert.equal(result.status, "AVAILABLE");
});

it("prevents simultaneous cover assignments", () => {
  const context = contextFor("L2", {
    absentPersonId: "someone-else",
    absences: [],
    existingCover: [
      {
        absentPersonId: "third-person",
        coveringPersonId: "crispin-cole",
        date: "2026-08-26",
        day: "TUESDAY",
        periodId: "L2",
        status: "COVERED",
      },
    ],
  });
  const result = resultFor("crispin-cole", context);
  assert.equal(result.eligible, false);
  assert.equal(result.status, "ALREADY_COVERING");
});

it("prevents absent staff from covering", () => {
  const result = resultFor("paul-hughes", contextFor("L1"));
  assert.equal(result.eligible, false);
  assert.equal(result.status, "ABSENT");
});

it("treats every teacher assigned to a multi-teacher lesson as busy", () => {
  const multiTeacherEntries: TimetableEntry[] = [
    ...timetableEntries,
    {
      id: "cole-mo-l2-pe",
      day: "MONDAY",
      periodId: "L2",
      personId: "crispin-cole",
      teachingEventId: "y7-pe-multi-mo-l2",
      subject: "PE",
      classCodes: ["Year 7A", "Year 7B"],
      status: "TEACHING",
    },
  ];

  const context = contextFor("L2", {
    day: "MONDAY",
    absentPersonId: "someone-else",
    absences: [],
    timetableEntries: multiTeacherEntries,
  });

  const result = resultFor("crispin-cole", context);
  assert.equal(result.eligible, false);
  assert.match(result.reasons[0], /Teaching Year 7A, Year 7B PE/);
});

it("keeps Year 9 setting groups as separate teaching events", () => {
  const year9Events = teachingEvents.filter((event) => event.yearGroup === "9" && event.subject === "Computing");
  assert.deepEqual(year9Events.map((event) => event.groupCode).sort(), ["Group 1", "Group 2"]);
  assert.equal(new Set(year9Events.map((event) => event.id)).size, 2);
});

it("uses lower historical cover load as a ranking advantage", () => {
  const lowLoad: Person = {
    id: "low-load",
    firstName: "Low",
    lastName: "Load",
    displayName: "Low Load",
    active: true,
    phase: "SECONDARY",
    roleType: "SECONDARY_TEACHER",
    subjects: ["Computing"],
    coverEligible: true,
    coverPriority: "NORMAL",
    registrationGroupId: null,
  };
  const highLoad = { ...lowLoad, id: "high-load", displayName: "High Load" };
  const context = contextFor("L8", {
    absentPersonId: "someone-else",
    absences: [],
    people: [lowLoad, highLoad],
    coverLoads: {
      "low-load": { today: 0, week: 0, term: 0, minutes: 0 },
      "high-load": { today: 2, week: 6, term: 20, minutes: 900 },
    },
  });

  const results = service.getAvailability(context);
  assert.equal(results[0].personId, "low-load");
  assert.ok(results[0].score > results[1].score);
});

let passed = 0;
for (const test of tests) {
  test.run();
  passed += 1;
  console.log(`PASS ${test.name}`);
}
console.log(`${passed} cover availability tests passed`);
