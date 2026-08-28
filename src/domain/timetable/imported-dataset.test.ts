import assert from "node:assert/strict";
import data from "../../db/imported-timetable-data";

type ImportedPerson = { displayName: string };
type ImportedPost = { name: string; status: string };
type ImportedResource = { name: string };
type ImportedPeriod = { id: string };
type ImportedEntry = {
  periodId: string;
  personId?: string | null;
  postId?: string | null;
  status: string;
  commitmentCode?: string | null;
  timetableVersionId: string;
};
type ImportedEvent = { assignedPersonIds: string[]; assignedPostIds: string[] };
type ImportedLunch = { source: string };
type ImportedDataset = {
  timetableVersion: { id: string };
  summary: { namedStaffImported: number; unresolvedLunches: number };
  people: ImportedPerson[];
  posts: ImportedPost[];
  ignoredResources: ImportedResource[];
  schoolPeriods: ImportedPeriod[];
  timetableEntries: ImportedEntry[];
  teachingEvents: ImportedEvent[];
  lunchAllocations: ImportedLunch[];
};

const imported = data as unknown as ImportedDataset;
const names = imported.people.map((person) => person.displayName);

assert.equal(imported.summary.namedStaffImported, 41);
assert.ok(names.includes("Mr Paul Hughes"));
assert.ok(imported.posts.some((post) => post.name === "Arabic 1" && post.status === "VACANT"));
assert.ok(imported.posts.some((post) => post.name === "Arabic 2" && post.status === "VACANT"));
assert.ok(imported.posts.some((post) => post.name === "Arabic HOD" && post.status === "VACANT"));
assert.ok(imported.posts.some((post) => post.name === "Arabic LS" && post.status === "VACANT"));
assert.deepEqual(imported.ignoredResources.map((item) => item.name), ["Duty Team"]);
assert.ok(!names.includes("EYFS Teacher"));
assert.ok(!names.includes("Primary Teacher"));
assert.ok(!JSON.stringify(imported).includes("sample-set-teacher"));
assert.ok(imported.timetableEntries.every((entry) => imported.schoolPeriods.some((period) => period.id === entry.periodId)));
assert.ok(imported.timetableEntries.every((entry) => entry.timetableVersionId === imported.timetableVersion.id));
assert.ok(imported.timetableEntries.every((entry) => entry.personId || entry.postId));
assert.ok(imported.timetableEntries.some((entry) => entry.status === "REGISTRATION"));
assert.ok(imported.timetableEntries.some((entry) => entry.status === "MEETING" && entry.commitmentCode === "SLT"));
assert.ok(imported.timetableEntries.some((entry) => entry.status === "UNCLASSIFIED"));
assert.ok(imported.teachingEvents.some((event) => event.assignedPersonIds.length + event.assignedPostIds.length > 1));
assert.ok(imported.lunchAllocations.some((allocation) => allocation.source === "SPECIALIST_RULE") || imported.summary.unresolvedLunches > 0);
console.log("PASS imported staff timetable dataset integrity checks");
