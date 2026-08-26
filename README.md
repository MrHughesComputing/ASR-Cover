# ASR Staff Cover Manager

Aldenham School Riyadh internal operations application for managing staff absence, timetable commitments, cover recommendations, cover assignment, validation, and fairness analytics.

## Tech Stack

- Next.js 16 App Router
- TypeScript, React, Tailwind CSS
- Prisma schema targeting PostgreSQL/Supabase
- Zod for server action validation
- date-fns ready for calendar logic
- Vitest for domain tests

## Architecture

The app deliberately separates `Person`, `Post`, `PersonPostAssignment`, timetable versions, teaching events, lunch allocation, registration, commitment codes, absences, cover assignments, and audit events. This supports vacant posts such as Arabic 1, Arabic 2, Arabic HOD, and Arabic LS without inventing staff names or deleting historical data.

Business rules live under `src/domain`, not inside React components. The key service is `CoverAvailabilityService`, which returns eligible and ineligible staff with scores and human-readable reasons.

## Database

The Prisma schema is in `prisma/schema.prisma`. It models authentication users and roles, staff, posts, post assignments, registration, school periods, timetable versions, timetable entries, commitment codes, absences, cover assignments, and audit events.

## Authentication

The initial role model supports `ADMIN` and `COVER_MANAGER`. Server-side permission checks are represented in `src/server/auth/permissions.ts` and used by server actions.

## Local Setup

```bash
npm install
cp .env.example .env
npm run db:generate
npm run dev
```

## Supabase Setup

Create a Supabase project, copy the hosted PostgreSQL connection string into `DATABASE_URL`, and add the browser-safe anon key to `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Keep `SUPABASE_SERVICE_ROLE_KEY` server-only.

## Environment Variables

See `.env.example`.

## Migrations

```bash
npm run db:migrate
```

## Seeding

```bash
npm run db:seed
```

The current seed layer includes ASR school periods, protected commitment codes, vacant Arabic posts, and a small normalized dataset derived from `Staff 26Aug.pdf`.

## Tests

```bash
npm run lint
npm run typecheck
npm run test
```

The domain tests cover EYFS lunch, primary lunch, specialist 6A/6B lunch, protected meetings, registration, no-registration availability, existing cover conflicts, absent staff, multi-teacher lessons, Year 9 setting groups, and fairness ranking.

## Timetable Import Process

`Staff 26Aug.pdf` is treated as an import source, not application logic. Imported rows should become `TimetableEntry` records attached to a `TimetableVersion`. Blank cells remain unclassified until an admin validates them. The Duty Team resource must be ignored.

```bash
npm run import:staff-pdf -- "C:\Users\mrpau\Downloads\Staff 26Aug.pdf"
```

## Cover Recommendation Logic

Hard exclusions remove staff who are teaching, in registration, on allocated lunch, supervising EYFS lunch, in PPA, in a protected meeting, already covering, absent, inactive, or not cover eligible.

Eligible staff are ranked using configurable priorities, phase fit, subject fit, leadership weighting, recent cover load, term cover load, and emergency/exempt status. Every recommendation includes an explanation.

## Deployment

The app is Vercel-compatible. Configure the same environment variables in Vercel, point `DATABASE_URL` at Supabase, run migrations, and deploy from GitHub.
