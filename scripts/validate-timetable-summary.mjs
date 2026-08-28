import { readFileSync } from "node:fs";

const data = JSON.parse(readFileSync("data/imports/staff-26aug.json", "utf8"));
const keys = [
  "timetableVersion",
  "namedStaffImported",
  "activeStaff",
  "vacantPosts",
  "ignoredResources",
  "registrationAssigned",
  "noRegistration",
  "staffWithoutRegistration",
  "teachingEvents",
  "timetableEntries",
  "entriesByWeekday",
  "multiTeacherEvents",
  "setGroupTeachingEvents",
  "protectedCommitments",
  "unresolvedLunches",
  "unclassifiedPeriods",
  "validationErrors",
  "validationWarnings",
];

console.log(JSON.stringify(Object.fromEntries(keys.map((key) => [key, data.summary[key]])), null, 2));
