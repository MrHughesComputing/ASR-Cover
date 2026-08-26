import { AppShell } from "@/components/app-shell";
import { getCoverRequirementsForPerson } from "@/domain/availability/cover-requirements";
import { people, schoolPeriods, teachingEvents, timetableEntries } from "@/db/seed-data";

export default function TodaysCoverPage() {
  const absent = people.find((person) => person.id === "paul-hughes")!;
  const requirements = getCoverRequirementsForPerson({ personId: absent.id, day: "TUESDAY", periods: schoolPeriods, entries: timetableEntries, teachingEvents });

  return (
    <AppShell>
      <section className="rounded-md border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-2xl font-semibold">Today&apos;s Cover</h2>
          <p className="text-sm text-slate-600">Grouped by timetable period with uncovered lessons made explicit.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
              <tr><th className="px-4 py-3">Period</th><th className="px-4 py-3">Absent</th><th className="px-4 py-3">Class</th><th className="px-4 py-3">Subject</th><th className="px-4 py-3">Cover</th><th className="px-4 py-3">Status</th></tr>
            </thead>
            <tbody>
              {requirements.map((requirement, index) => (
                <tr key={requirement.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium">{requirement.period.label} - {requirement.period.startTime}</td>
                  <td className="px-4 py-3">{absent.displayName}</td>
                  <td className="px-4 py-3">{requirement.entry.classCodes.join(", ") || "Internal"}</td>
                  <td className="px-4 py-3">{requirement.entry.subject ?? requirement.entry.commitmentCode ?? requirement.entry.status}</td>
                  <td className="px-4 py-3">{index === 0 ? "Mrs Hina Khan" : "-"}</td>
                  <td className="px-4 py-3">
                    <span className={index === 0 ? "rounded-md bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-900" : requirement.coverNeeded ? "rounded-md bg-red-100 px-2 py-1 text-xs font-semibold text-red-900" : "rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700"}>
                      {index === 0 ? "COVERED" : requirement.coverNeeded ? "UNCOVERED" : "NO COVER REQUIRED"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
