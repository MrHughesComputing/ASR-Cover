import { AlertTriangle, CheckCircle2, Clock, UserMinus, Users } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { CoverAvailabilityService } from "@/domain/availability/cover-availability-service";
import { getCoverRequirementsForPerson } from "@/domain/availability/cover-requirements";
import {
  coverLoads,
  existingCover,
  lunchAllocations,
  people,
  protectedCommitmentCodes,
  schoolPeriods,
  teachingEvents,
  timetableEntries,
} from "@/db/seed-data";

export default function Dashboard() {
  const service = new CoverAvailabilityService();
  const requirements = getCoverRequirementsForPerson({
    personId: "paul-hughes",
    day: "TUESDAY",
    periods: schoolPeriods,
    entries: timetableEntries,
    teachingEvents,
  });
  const requiredCover = requirements.filter((requirement) => requirement.coverNeeded);
  const currentPeriod = schoolPeriods.find((period) => period.id === "L2")!;
  const recommendations = service
    .getAvailability({
      date: "2026-08-26",
      day: "TUESDAY",
      period: currentPeriod,
      absentPersonId: "paul-hughes",
      targetTeachingEvent: teachingEvents[0],
      people,
      timetableEntries,
      lunchAllocations,
      commitmentCodes: protectedCommitmentCodes,
      existingCover,
      absences: [{ personId: "paul-hughes", periodIds: requiredCover.map((item) => item.period.id) }],
      coverLoads,
    })
    .filter((candidate) => candidate.eligible);

  const stats = [
    { label: "Staff absent today", value: "1", icon: UserMinus },
    { label: "Lessons requiring cover", value: String(requiredCover.length), icon: AlertTriangle },
    { label: "Covered", value: "1", icon: CheckCircle2 },
    { label: "Still uncovered", value: String(Math.max(requiredCover.length - 1, 0)), icon: Clock },
    { label: "Staff available now", value: String(recommendations.length), icon: Users },
    { label: "Covers assigned today", value: "2", icon: CheckCircle2 },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-md border border-slate-200 bg-white p-4">
              <stat.icon className="h-5 w-5 text-teal-700" aria-hidden />
              <p className="mt-3 text-2xl font-semibold">{stat.value}</p>
              <p className="text-sm text-slate-600">{stat.label}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
          <div className="rounded-md border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-lg font-semibold">Absence Workflow</h2>
              <p className="text-sm text-slate-600">Whole-day absence selected for Mr Paul Hughes on Tuesday.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3">Period</th>
                    <th className="px-4 py-3">Class</th>
                    <th className="px-4 py-3">Subject</th>
                    <th className="px-4 py-3">Cover</th>
                  </tr>
                </thead>
                <tbody>
                  {requirements.map((requirement) => (
                    <tr key={requirement.id} className="border-t border-slate-100">
                      <td className="px-4 py-3 font-medium">{requirement.period.startTime}</td>
                      <td className="px-4 py-3">{requirement.period.label}</td>
                      <td className="px-4 py-3">{requirement.entry.classCodes.join(", ") || "Internal"}</td>
                      <td className="px-4 py-3">{requirement.entry.subject ?? requirement.entry.commitmentCode ?? requirement.entry.status}</td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            requirement.coverNeeded
                              ? "rounded-md bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-900"
                              : "rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600"
                          }
                        >
                          {requirement.coverNeeded ? "Required" : "No cover required"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-md border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-lg font-semibold">Recommended For Lesson 2</h2>
              <p className="text-sm text-slate-600">Ranked by hard availability, role, phase and cover load.</p>
            </div>
            <div className="divide-y divide-slate-100">
              {recommendations.map((candidate) => (
                <div key={candidate.personId} className="px-5 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">{candidate.displayName}</p>
                    <span className="rounded-md bg-teal-100 px-2 py-1 text-xs font-semibold text-teal-900">
                      Score {candidate.score}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{candidate.reasons.join(" - ")}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
