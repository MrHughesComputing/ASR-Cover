# ASR Staff Cover Manager

Aldenham School Riyadh internal operations application for managing staff absence, timetable commitments, cover recommendations, cover assignment, validation, and fairness analytics.

## Current Build Status

The application has been created locally in a new Git repository at:

`C:\Users\mrpau\Documents\Codex\2026-08-26\files-mentioned-by-the-user-staff\asr-staff-cover-manager`

Local commit:

`72b7e25 Initial ASR staff cover manager`

The local code passed:

```bash
npm run lint
npm run typecheck
npm run test
npm run db:seed
npm run import:staff-pdf
```

The test suite passes 11 cover-rule checks covering EYFS lunch, primary lunch, specialist 6A/6B lunch, protected meetings, registration, no-registration availability, simultaneous cover conflicts, absent staff, multi-teacher lessons, Year 9 setting groups, and fairness ranking.

## Tech Stack

- Next.js 16 App Router
- TypeScript, React, Tailwind CSS
- Prisma schema targeting PostgreSQL/Supabase
- Zod for server action validation
- date-fns ready for calendar logic
- TypeScript/Node domain tests

## Architecture

The app deliberately separates `Person`, `Post`, `PersonPostAssignment`, timetable versions, teaching events, lunch allocation, registration, commitment codes, absences, cover assignments, and audit events. This supports vacant posts such as Arabic 1, Arabic 2, Arabic HOD, and Arabic LS without inventing staff names or deleting historical data.

Business rules live under `src/domain`, not inside React components. The key service is `CoverAvailabilityService`, which returns eligible and ineligible staff with scores and human-readable reasons.

## Important Note

The Codex environment could authenticate to this GitHub repository through the GitHub connector, but local Windows Git could not push because its HTTPS credential helper failed with `SEC_E_NO_CREDENTIALS` / shell `EPERM` errors. The full source remains committed locally and ready to push from a normal authenticated terminal.
