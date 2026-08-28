import { AppShell } from "@/components/app-shell";
import { protectedCommitmentCodes, schoolPeriods } from "@/db/seed-data";
import { getFirstRunValidation } from "@/features/timetable/validation";

export default function TimetablesPage() {
  const issues = getFirstRunValidation();

  return (
    <AppShell>
      <div className="space-y-5">
        <div>
          <h2 className="text-2xl font-semibold">Timetable Import And Validation</h2>
          <p className="text-sm text-slate-600">
            Staff 26Aug.pdf has been imported as Staff Timetable 26 Aug 2026. Corrections are stored as operational timetable entries.
          </p>
        </div>

        <a href="/timetables/validation" className="inline-flex rounded-md border border-teal-700 px-3 py-2 text-sm font-semibold text-teal-800">
          Open validation report
        </a>

        <section className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-md border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Active version</p>
            <p className="text-xl font-semibold">Staff 26Aug</p>
          </div>
          <div className="rounded-md border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">School periods</p>
            <p className="text-xl font-semibold">{schoolPeriods.length}</p>
          </div>
          <div className="rounded-md border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Protected codes</p>
            <p className="text-xl font-semibold">{protectedCommitmentCodes.length}</p>
          </div>
        </section>

        <section className="rounded-md border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4">
            <h3 className="font-semibold">First-Run Validation</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {issues.map((issue) => (
              <div key={issue.code} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm">
                <span>{issue.message}</span>
                <span
                  className={
                    issue.severity === "ACTION_REQUIRED"
                      ? "rounded-md bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-900"
                      : "rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700"
                  }
                >
                  {issue.severity}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
