import { existsSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";

const rawArg = process.argv.slice(2).join(" ").replaceAll("^", "").trim();
const pdfPath = rawArg || "C:\\Users\\mrpau\\Downloads\\Staff 26Aug.pdf";
const resolved = isAbsolute(pdfPath) ? pdfPath : resolve(pdfPath);

if (!existsSync(resolved)) {
  throw new Error(`PDF not found: ${resolved}`);
}

console.log(`Import source found: ${resolved}`);
console.log("Use the Prisma TimetableVersion and TimetableEntry models for normalized imports.");
console.log("Operational statuses, lunch allocations, and ambiguous blanks must be validated by an admin before use.");
