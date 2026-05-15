import { Clock3, FileText, RefreshCcw, ShieldAlert } from "lucide-react";

const mockLogs = [
  { id: 1, event: "Repository data sync completed", time: "10:30" },
  { id: 2, event: "Convenor role updated", time: "09:50" },
  { id: 3, event: "System settings reviewed", time: "Yesterday" },
  { id: 4, event: "Support thread resolved", time: "Yesterday" },
];

function AdminLogs() {
  return (
    <div className="admin-page space-y-4">
      <section className="admin-surface rounded-2xl border border-[#d7e1f0] bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7188a9]">Logs & Activity</p>
            <h1 className="text-2xl font-bold text-[#21344e]">Operational Timeline</h1>
            <p className="mt-1 text-sm text-[#5f7698]">Track key platform events and administrative actions.</p>
          </div>
          <button className="inline-flex items-center gap-2 rounded-lg border border-[#cedcef] bg-[#eff5ff] px-3 py-2 text-sm font-semibold text-[#365988]" type="button">
            <RefreshCcw className="h-4 w-4" /> Refresh
          </button>
        </div>

        <div className="mt-4 space-y-2">
          {mockLogs.map((log) => (
            <article key={log.id} className="admin-surface-muted rounded-xl border border-[#d8e3f2] bg-[#f9fbff] p-3">
              <p className="text-sm font-semibold text-[#2f4768]"><FileText className="mr-1 inline h-3.5 w-3.5" /> {log.event}</p>
              <p className="mt-1 text-xs text-[#6f86a6]"><Clock3 className="mr-1 inline h-3.5 w-3.5" /> {log.time}</p>
            </article>
          ))}
        </div>

        <div className="mt-4 rounded-xl border border-[#f0d9de] bg-[#fff8fa] p-4 text-sm text-[#a04b5a]">
          <ShieldAlert className="mr-1 inline h-4 w-4" /> Full audit log export can be connected to backend event table in next iteration.
        </div>
      </section>
    </div>
  );
}

export default AdminLogs;
