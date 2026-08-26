import { people, protectedCommitmentCodes, schoolPeriods, vacantPosts } from "../src/db/seed-data";

console.log("Seed preview");
console.table({
  periods: schoolPeriods.length,
  protectedCodes: protectedCommitmentCodes.length,
  vacantPosts: vacantPosts.length,
  people: people.length,
});
