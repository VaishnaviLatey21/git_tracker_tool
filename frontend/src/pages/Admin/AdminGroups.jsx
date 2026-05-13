import { BarChart3, ShieldAlert, UsersRound } from "lucide-react";

function AdminGroups() {
  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-[#d7e1f0] bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7188a9]">Groups</p>
        <h1 className="text-2xl font-bold text-[#21344e]">Group Oversight</h1>
        <p className="mt-1 text-sm text-[#5f7698]">Compare group health, monitor inactive teams and track risk signals.</p>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <article className="rounded-xl border border-[#d8e3f2] bg-[#f9fbff] p-4">
            <p className="text-xs uppercase tracking-wide text-[#6f86a6] font-semibold"><UsersRound className="mr-1 inline h-3.5 w-3.5" /> Team Monitoring</p>
            <p className="mt-2 text-sm text-[#3d5679]">Validate group membership and contribution balance.</p>
          </article>
          <article className="rounded-xl border border-[#d8e3f2] bg-[#f9fbff] p-4">
            <p className="text-xs uppercase tracking-wide text-[#6f86a6] font-semibold"><ShieldAlert className="mr-1 inline h-3.5 w-3.5" /> Risk Review</p>
            <p className="mt-2 text-sm text-[#3d5679]">Identify high-risk groups requiring convenor intervention.</p>
          </article>
          <article className="rounded-xl border border-[#d8e3f2] bg-[#f9fbff] p-4">
            <p className="text-xs uppercase tracking-wide text-[#6f86a6] font-semibold"><BarChart3 className="mr-1 inline h-3.5 w-3.5" /> Trend Analysis</p>
            <p className="mt-2 text-sm text-[#3d5679]">Observe weekly activity and deadline spike behavior.</p>
          </article>
        </div>
      </section>
    </div>
  );
}

export default AdminGroups;
