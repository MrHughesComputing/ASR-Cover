import assert from "node:assert/strict";
import { getRiyadhSchoolDay, formatRiyadhDate } from "./school-date";

assert.equal(getRiyadhSchoolDay("2026-08-26"), "WEDNESDAY");
assert.match(formatRiyadhDate("2026-08-26"), /Wednesday/);
console.log("PASS Riyadh school date utility resolves 2026-08-26 as Wednesday");
