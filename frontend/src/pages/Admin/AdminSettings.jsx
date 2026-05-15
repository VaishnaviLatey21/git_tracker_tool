import { Bell, Cog, ShieldCheck, Wrench } from "lucide-react";

function AdminSettings() {
  return (
    <div className="admin-page space-y-4">
      <section className="admin-surface rounded-2xl border border-[#d7e1f0] bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7188a9]">System Settings</p>
        <h1 className="text-2xl font-bold text-[#21344e]">Platform Configuration</h1>
        <p className="mt-1 text-sm text-[#5f7698]">Central controls for security, notifications and operational defaults.</p>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <article className="admin-surface-muted rounded-xl border border-[#d8e3f2] bg-[#f9fbff] p-4">
            <p className="text-xs uppercase tracking-wide text-[#6f86a6] font-semibold"><ShieldCheck className="mr-1 inline h-3.5 w-3.5" /> Security Policy</p>
            <ul className="mt-2 space-y-1 text-sm text-[#3d5679]">
              <li>Role-based access enforcement enabled.</li>
              <li>Admin account protection checks active.</li>
              <li>Password change flow available for all roles.</li>
            </ul>
          </article>
          <article className="admin-surface-muted rounded-xl border border-[#d8e3f2] bg-[#f9fbff] p-4">
            <p className="text-xs uppercase tracking-wide text-[#6f86a6] font-semibold"><Bell className="mr-1 inline h-3.5 w-3.5" /> Notifications</p>
            <ul className="mt-2 space-y-1 text-sm text-[#3d5679]">
              <li>Convenor support alerts in header icons.</li>
              <li>Unread queue refresh every 25 seconds.</li>
              <li>Thread-level message acknowledgements enabled.</li>
            </ul>
          </article>
        </div>

        <div className="mt-4 rounded-xl border border-[#d8e3f2] bg-[#f7fbff] p-4 text-sm text-[#456081]">
          <Cog className="mr-1 inline h-4 w-4" /> Advanced configuration can be extended with environment-specific controls.
        </div>

        <div className="mt-3 rounded-xl border border-[#d8e3f2] bg-[#f7fbff] p-4 text-sm text-[#456081]">
          <Wrench className="mr-1 inline h-4 w-4" /> Current settings section is intentionally safe and non-destructive.
        </div>
      </section>
    </div>
  );
}

export default AdminSettings;
