import { GitBranch, Link2, Lock, RefreshCcw } from "lucide-react";

function AdminRepositories() {
  return (
    <div className="admin-page space-y-4">
      <section className="admin-surface rounded-2xl border border-[#d7e1f0] bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7188a9]">Repositories</p>
        <h1 className="text-2xl font-bold text-[#21344e]">Repository Management</h1>
        <p className="mt-1 text-sm text-[#5f7698]">Govern repository access, linkage and synchronization quality.</p>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <article className="admin-surface-muted rounded-xl border border-[#d8e3f2] bg-[#f9fbff] p-4">
            <p className="text-xs uppercase tracking-wide text-[#6f86a6] font-semibold"><Link2 className="mr-1 inline h-3.5 w-3.5" /> Linked Repositories</p>
            <p className="mt-2 text-sm text-[#3d5679]">Audit whether student groups have valid GitHub/GitLab links.</p>
          </article>
          <article className="admin-surface-muted rounded-xl border border-[#d8e3f2] bg-[#f9fbff] p-4">
            <p className="text-xs uppercase tracking-wide text-[#6f86a6] font-semibold"><Lock className="mr-1 inline h-3.5 w-3.5" /> Access Control</p>
            <p className="mt-2 text-sm text-[#3d5679]">Ensure memberships and permissions are correctly applied.</p>
          </article>
          <article className="admin-surface-muted rounded-xl border border-[#d8e3f2] bg-[#f9fbff] p-4">
            <p className="text-xs uppercase tracking-wide text-[#6f86a6] font-semibold"><RefreshCcw className="mr-1 inline h-3.5 w-3.5" /> Sync Health</p>
            <p className="mt-2 text-sm text-[#3d5679]">Monitor fetch status and fix stale analytics data quickly.</p>
          </article>
        </div>

        <div className="mt-4 rounded-xl border border-[#d8e3f2] bg-[#f7fbff] p-4 text-sm text-[#456081]">
          <GitBranch className="mr-1 inline h-4 w-4" /> For direct repo-level audits, use Convenor analytics and support inbox for escalation.
        </div>
      </section>
    </div>
  );
}

export default AdminRepositories;
