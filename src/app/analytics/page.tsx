import { AppShell } from "@/components/app-shell";
import { coverLoads, people } from "@/db/seed-data";

export default function AnalyticsPage() {
  const rows = people.map((person) => ({ person, load: coverLoads[person.id] ?? { today: 0, week: 0, term: 0, minutes: 0 } }));

  return (
    <AppShell>
      <section className="rounded-md border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-2xl font-semibold">Cover Analytics</h2>
          <p className="text-sm text-slate-600">Fairness inputs used by recommendation ranking.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600"><tr><th className="px-4 py-3">Staff</th><th className="px-4 py-3">Today</th><th className="px-4 py-3">Week</th><th className="px-4 py-3">Term</th><th className="px-4 py-3">Minutes</th></tr></thead>
            <tbody>{rows.map(({ person, load }) => <tr key={person.id} className="border-t border-slate-100"><td className="px-4 py-3 font-medium">{person.displayName}</td><td className="px-4 py-3">{load.today}</td><td className="px-4 py-3">{load.week}</td><td className="px-4 py-3">{load.term}</td><td className="px-4 py-3">{load.minutes}</td></tr>)}</tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
