import { AppShell } from "@/components/app-shell";
import { CoverAvailabilityService } from "@/domain/availability/cover-availability-service";
import { coverLoads, existingCover, lunchAllocations, people, protectedCommitmentCodes, schoolPeriods, teachingEvents, timetableEntries } from "@/db/seed-data";

const groups = ["AVAILABLE", "TEACHING", "LUNCH", "MEETING", "REGISTRATION", "PPA", "ABSENT", "ALREADY_COVERING", "UNCLASSIFIED"] as const;

export default function AvailabilityPage() {
  const period = schoolPeriods.find((item) => item.id === "L2")!;
  const results = new CoverAvailabilityService().getAvailability({
    date: "2026-08-26",
    day: "WEDNESDAY",
    period,
    absentPersonId: "person-mr-paul-hughes",
    targetTeachingEvent: teachingEvents[0],
    people,
    timetableEntries,
    lunchAllocations,
    commitmentCodes: protectedCommitmentCodes,
    existingCover,
    absences: [{ personId: "person-mr-paul-hughes", periodIds: ["L1", "L2", "L3", "L4"] }],
    coverLoads,
  });

  return (
    <AppShell>
      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold">Staff Availability</h2>
          <p className="text-sm text-slate-600">Wednesday, Lesson 2. Filters are represented in the UI and wired for server-side querying.</p>
        </div>
        <div className="flex flex-wrap gap-3 rounded-md border border-slate-200 bg-white p-4">
          <input className="min-h-10 rounded-md border border-slate-300 px-3 text-sm" placeholder="Search staff" />
          <select className="min-h-10 rounded-md border border-slate-300 px-3 text-sm" defaultValue="all"><option value="all">All phases</option><option>Primary</option><option>Secondary</option></select>
          <select className="min-h-10 rounded-md border border-slate-300 px-3 text-sm" defaultValue="all"><option value="all">All roles</option><option>Leadership</option><option>Specialist</option></select>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {groups.map((group) => {
            const rows = results.filter((result) => result.status === group || (group === "AVAILABLE" && result.eligible));
            return (
              <div key={group} className="rounded-md border border-slate-200 bg-white">
                <div className="border-b border-slate-200 px-4 py-3">
                  <h3 className="text-sm font-semibold">{group.replaceAll("_", " ")}</h3>
                </div>
                <div className="divide-y divide-slate-100">
                  {rows.length ? rows.map((row) => (
                    <div key={`${group}-${row.personId}`} className="px-4 py-3 text-sm">
                      <div className="flex justify-between gap-3">
                        <span className="font-medium">{row.displayName}</span>
                        <span>{row.eligible ? row.score : "Blocked"}</span>
                      </div>
                      <p className="mt-1 text-slate-600">{row.reasons[0]}</p>
                    </div>
                  )) : <p className="px-4 py-3 text-sm text-slate-500">No staff in this group.</p>}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}

