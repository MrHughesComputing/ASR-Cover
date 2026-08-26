import { AppShell } from "@/components/app-shell";
import { protectedCommitmentCodes, schoolPeriods } from "@/db/seed-data";

export default function SettingsPage() {
  return (
    <AppShell>
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-md border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4"><h2 className="text-xl font-semibold">School Day Times</h2></div>
          <div className="divide-y divide-slate-100">{schoolPeriods.map((period) => <div key={period.id} className="grid grid-cols-3 gap-3 px-5 py-3 text-sm"><span className="font-medium">{period.label}</span><span>{period.startTime}</span><span>{period.endTime}</span></div>)}</div>
        </section>
        <section className="rounded-md border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4"><h2 className="text-xl font-semibold">Protected Commitment Codes</h2></div>
          <div className="divide-y divide-slate-100">{protectedCommitmentCodes.map((code) => <div key={code.code} className="flex justify-between gap-3 px-5 py-3 text-sm"><span className="font-medium">{code.code}</span><span>{code.protected ? "Protected" : "Cover eligible"}</span></div>)}</div>
        </section>
      </div>
    </AppShell>
  );
}
