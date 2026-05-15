import { Database, FolderKanban, GitBranch, LayoutList, UsersRound } from "lucide-react";
import { Link } from "react-router-dom";

function AdminModules() {
  return (
    <div className="admin-page space-y-4">
      <section className="admin-surface rounded-2xl border border-[#d7e1f0] bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7188a9]">Modules</p>
        <h1 className="text-2xl font-bold text-[#21344e]">Module & Group Management</h1>
        <p className="mt-1 text-sm text-[#5f7698]">Admin-level governance for academic structure and repository linking.</p>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <article className="admin-surface-muted rounded-xl border border-[#d8e3f2] bg-[#f9fbff] p-4">
            <p className="text-xs uppercase tracking-wide text-[#6f86a6] font-semibold"><Database className="mr-1 inline h-3.5 w-3.5" /> Module Catalog</p>
            <p className="mt-2 text-sm text-[#3d5679]">Review module ownership and threshold configuration.</p>
          </article>
          <article className="admin-surface-muted rounded-xl border border-[#d8e3f2] bg-[#f9fbff] p-4">
            <p className="text-xs uppercase tracking-wide text-[#6f86a6] font-semibold"><UsersRound className="mr-1 inline h-3.5 w-3.5" /> Group Structure</p>
            <p className="mt-2 text-sm text-[#3d5679]">Track student group allocations and consistency.</p>
          </article>
          <article className="admin-surface-muted rounded-xl border border-[#d8e3f2] bg-[#f9fbff] p-4">
            <p className="text-xs uppercase tracking-wide text-[#6f86a6] font-semibold"><GitBranch className="mr-1 inline h-3.5 w-3.5" /> Repository Coverage</p>
            <p className="mt-2 text-sm text-[#3d5679]">Ensure every group has a linked Git repository.</p>
          </article>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link className="inline-flex items-center gap-2 rounded-lg border border-[#cedcef] bg-[#eff5ff] px-3 py-2 text-sm font-semibold text-[#365988]" to="/admin/users">
            <LayoutList className="h-4 w-4" /> Open User Management
          </Link>
          <Link className="inline-flex items-center gap-2 rounded-lg border border-[#cedcef] bg-[#eff5ff] px-3 py-2 text-sm font-semibold text-[#365988]" to="/admin/roles">
            <FolderKanban className="h-4 w-4" /> Open Roles & Permissions
          </Link>
        </div>
      </section>
    </div>
  );
}

export default AdminModules;
