import { AppShell } from "@/components/app-shell";
import { people, schoolPeriods } from "@/db/seed-data";

export default function AbsencesPage() {
  return (
    <AppShell>
      <section className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <form className="rounded-md border border-slate-200 bg-white p-5">
          <h2 className="text-xl font-semibold">Record Absence</h2>
          <div className="mt-4 space-y-3">
            <label className="block text-sm font-medium">Date<input type="date" defaultValue="2026-08-26" className="mt-1 min-h-10 w-full rounded-md border border-slate-300 px-3" /></label>
            <label className="block text-sm font-medium">Absent staff<select className="mt-1 min-h-10 w-full rounded-md border border-slate-300 px-3" defaultValue="paul-hughes">{people.map((person) => <option key={person.id} value={person.id}>{person.displayName}</option>)}</select></label>
            <label className="block text-sm font-medium">Scope<select className="mt-1 min-h-10 w-full rounded-md border border-slate-300 px-3" defaultValue="WHOLE_DAY"><option>WHOLE_DAY</option><option>PART_DAY</option><option>SINGLE_PERIOD</option></select></label>
            <button className="w-full rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white">Generate Requirements</button>
          </div>
        </form>
        <div className="rounded-md border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-xl font-semibold">Custom Period Selection</h2>
            <p className="text-sm text-slate-600">Part-day and single-period absences use explicit period IDs, not inferred blank cells.</p>
          </div>
          <div className="grid gap-2 p-5 sm:grid-cols-3 lg:grid-cols-4">
            {schoolPeriods.filter((period) => period.coverRelevant).map((period) => (
              <label key={period.id} className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm">
                <input type="checkbox" defaultChecked={period.id !== "CCA"} />
                <span>{period.label} {period.startTime}</span>
              </label>
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
