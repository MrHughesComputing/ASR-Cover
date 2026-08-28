"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { importSummary, validationIssues } from "@/db/seed-data";

type ValidationSeverity = "ERROR" | "WARNING";
type ValidationIssue = { severity: ValidationSeverity; type: string; message: string };

const severityClass: Record<ValidationSeverity, string> = {
  ERROR: "bg-red-100 text-red-900 border-red-200",
  WARNING: "bg-amber-100 text-amber-900 border-amber-200",
};

const dayOptions = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY"];
const typeOptions = ["UNCLASSIFIED_PERIOD", "AMBIGUOUS_ENTRY", "MISSING_CLASS", "UNRESOLVED_SPECIALIST_LUNCH"];

export default function TimetableValidationPage() {
  const [staffFilter, setStaffFilter] = useState("");
  const [dayFilter, setDayFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const summary = importSummary as Record<string, unknown>;
  const issues = validationIssues as ValidationIssue[];
  const errors = issues.filter((issue) => issue.severity === "ERROR");
  const warnings = issues.filter((issue) => issue.severity === "WARNING");

  const visibleIssues = useMemo(() => {
    const staff = staffFilter.trim().toLowerCase();
    return issues.filter((issue) => {
      const message = issue.message.toLowerCase();
      const matchesStaff = staff.length === 0 || message.includes(staff);
      const matchesDay = dayFilter === "all" || issue.message.includes(dayFilter);
      const matchesType = typeFilter === "all" || issue.type === typeFilter;
      const matchesSeverity = severityFilter === "all" || issue.severity === severityFilter;
      return matchesStaff && matchesDay && matchesType && matchesSeverity;
    });
  }, [dayFilter, issues, severityFilter, staffFilter, typeFilter]);

  return (
    <AppShell>
      <div className="space-y-5">
        <div>
          <h2 className="text-2xl font-semibold">Timetable Validation</h2>
          <p className="text-sm text-slate-600">Staff Timetable 26 Aug 2026 import integrity report.</p>
        </div>

        <section className="grid gap-3 md:grid-cols-4">
          <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm text-emerald-800">Named staff</p>
            <p className="text-2xl font-semibold">{String(summary.namedStaffImported ?? 0)}</p>
          </div>
          <div className="rounded-md border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-600">Timetable entries</p>
            <p className="text-2xl font-semibold">{String(summary.timetableEntries ?? 0)}</p>
          </div>
          <div className="rounded-md border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-800">Critical errors</p>
            <p className="text-2xl font-semibold">{errors.length}</p>
          </div>
          <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm text-amber-800">Needs review</p>
            <p className="text-2xl font-semibold">{warnings.length}</p>
          </div>
        </section>

        <section className="flex flex-wrap gap-3 rounded-md border border-slate-200 bg-white p-4">
          <input
            className="min-h-10 rounded-md border border-slate-300 px-3 text-sm"
            onChange={(event) => setStaffFilter(event.target.value)}
            placeholder="Filter by staff member"
            value={staffFilter}
          />
          <select className="min-h-10 rounded-md border border-slate-300 px-3 text-sm" onChange={(event) => setDayFilter(event.target.value)} value={dayFilter}>
            <option value="all">All weekdays</option>
            {dayOptions.map((day) => <option key={day} value={day}>{day[0] + day.slice(1).toLowerCase()}</option>)}
          </select>
          <select className="min-h-10 rounded-md border border-slate-300 px-3 text-sm" onChange={(event) => setTypeFilter(event.target.value)} value={typeFilter}>
            <option value="all">All issue types</option>
            {typeOptions.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
          <select className="min-h-10 rounded-md border border-slate-300 px-3 text-sm" onChange={(event) => setSeverityFilter(event.target.value)} value={severityFilter}>
            <option value="all">All severities</option>
            <option value="ERROR">Errors</option>
            <option value="WARNING">Warnings</option>
          </select>
        </section>

        <section className="rounded-md border border-slate-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
            <h3 className="font-semibold">Open Validation Items</h3>
            <p className="text-sm text-slate-500">{visibleIssues.length} visible</p>
          </div>
          <div className="max-h-[680px] divide-y divide-slate-100 overflow-auto">
            {visibleIssues.slice(0, 700).map((issue, index) => (
              <div key={`${issue.type}-${issue.message}-${index}`} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm">
                <span>{issue.message}</span>
                <span className={`rounded-md border px-2 py-1 text-xs font-semibold ${severityClass[issue.severity]}`}>{issue.type}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
