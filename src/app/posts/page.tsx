import { AppShell } from "@/components/app-shell";
import { vacantPosts } from "@/db/seed-data";

export default function PostsPage() {
  return (
    <AppShell>
      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold">Vacant Posts</h2>
          <p className="text-sm text-slate-600">Posts exist independently of people, so a timetable can be assigned before recruitment completes.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {vacantPosts.map((post) => (
            <article key={post.id} className="rounded-md border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div><h3 className="text-lg font-semibold">{post.name}</h3><p className="text-sm text-slate-600">{post.phase} - {post.subject}</p></div>
                <span className="rounded-md bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-900">VACANT</span>
              </div>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div><dt className="text-slate-500">Timetable</dt><dd className="font-medium">Ready for assignment</dd></div>
                <div><dt className="text-slate-500">Current employee</dt><dd className="font-medium">None</dd></div>
              </dl>
              <button className="mt-4 rounded-md border border-teal-700 px-3 py-2 text-sm font-semibold text-teal-800">Assign Person</button>
            </article>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
