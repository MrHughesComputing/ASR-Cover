import Link from "next/link";
import {
  BarChart3,
  CalendarClock,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  UserRoundCog,
  Users,
} from "lucide-react";

const navigation = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/today", label: "Today's Cover", icon: ClipboardList },
  { href: "/absences", label: "Absences", icon: CalendarClock },
  { href: "/availability", label: "Staff Availability", icon: ShieldCheck },
  { href: "/staff", label: "Staff", icon: Users },
  { href: "/timetables", label: "Timetables", icon: CalendarDays },
  { href: "/posts", label: "Vacant Posts", icon: UserRoundCog },
  { href: "/analytics", label: "Cover Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const date = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date("2026-08-26T08:00:00+03:00"));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-slate-200 bg-white lg:block">
        <div className="border-b border-slate-200 px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Aldenham School Riyadh</p>
          <h1 className="mt-2 text-xl font-semibold">Staff Cover Manager</h1>
        </div>
        <nav className="px-3 py-4">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-teal-50 hover:text-teal-900"
            >
              <item.icon className="h-4 w-4" aria-hidden />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Operations console</p>
              <p className="text-sm font-semibold text-slate-900">{date}</p>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-medium text-emerald-800">
                Auth: Admin
              </span>
              <span className="font-medium text-slate-700">cover.manager@aldenhamriyadh.sa</span>
            </div>
          </div>
        </header>
        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
