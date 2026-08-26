import { AppShell } from "@/components/app-shell";
import { coverLoads, lunchAllocations, people, schoolPeriods, timetableEntries } from "@/db/seed-data";

export default function StaffPage() {
  return (
    <AppShell>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold">Staff</h2>
            <p className="text-sm text-slate-600">CRUD-ready staff records with post, registration, lunch and cover settings separated.</p>
          </div>
          <button className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white">Add Staff</button>
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          {people.map((person) => (
            <article key={person.id} className="rounded-md border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold">{person.displayName}</h3>
                  <p className="text-sm text-slate-600">{person.roleType.replaceAll("_", " ")} - {person.phase}</p>
                </div>
                <span className="h-fit rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{person.coverPriority}</span>
              </div>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                <div><dt className="text-slate-500">Registration</dt><dd className="font-medium">{person.registrationGroupId ?? "Explicitly none"}</dd></div>
                <div><dt className="text-slate-500">Lunch</dt><dd className="font-medium">{lunchAllocations.filter((item) => item.personId === person.id).map((item) => item.periodId).join(", ") || "Needs review"}</dd></div>
                <div><dt className="text-slate-500">Week covers</dt><dd className="font-medium">{coverLoads[person.id]?.week ?? 0}</dd></div>
              </dl>
              <div className="mt-4 grid grid-cols-6 gap-1 text-xs">
                {schoolPeriods.filter((period) => period.coverRelevant).map((period) => {
                  const entry = timetableEntries.find((item) => item.personId === person.id && item.periodId === period.id);
                  return <div key={period.id} className="rounded border border-slate-200 px-2 py-2 text-center">{period.id}<br />{entry?.status ?? "BLANK"}</div>;
                })}
              </div>
            </article>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
