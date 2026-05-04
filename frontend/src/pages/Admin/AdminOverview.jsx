import { useEffect, useMemo, useState } from "react";
import { BarChart3, Database, GitCommitHorizontal, ShieldAlert, Users } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import axios from "../../api/axios";

const fallbackSummary = {
  totals: {
    users: 0,
    verifiedUsers: 0,
    modules: 0,
    groups: 0,
    repositories: 0,
    commits: 0,
    flaggedContributors: 0,
  },
  usersByRole: {
    ADMIN: 0,
    CONVENOR: 0,
    STUDENT: 0,
  },
  trends: {
    commitActivity: [],
    userSignups: [],
  },
};

function AdminOverview() {
  const [summary, setSummary] = useState(fallbackSummary);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSummary = async () => {
      setLoading(true);
      try {
        const response = await axios.get("/admin/summary");
        setSummary(response.data || fallbackSummary);
      } catch (error) {
        console.error("Failed to load admin summary:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSummary();
  }, []);

  const roleDistribution = useMemo(
    () => [
      { role: "Admin", count: summary.usersByRole.ADMIN || 0 },
      { role: "Convenor", count: summary.usersByRole.CONVENOR || 0 },
      { role: "Student", count: summary.usersByRole.STUDENT || 0 },
    ],
    [summary.usersByRole]
  );

  if (loading) {
    return <div className="rounded-2xl border border-[#d7e1f0] bg-white p-6">Loading admin summary...</div>;
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-[#d7e1f0] bg-white p-5 shadow-sm">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#7188a9]">
            <Users className="h-3.5 w-3.5" />
            Total Users
          </p>
          <h2 className="mt-2 text-3xl font-bold text-[#233652]">{summary.totals.users}</h2>
          <p className="mt-1 text-sm text-[#6b819f]">
            Verified: {summary.totals.verifiedUsers}
          </p>
        </article>

        <article className="rounded-2xl border border-[#d7e1f0] bg-white p-5 shadow-sm">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#7188a9]">
            <Database className="h-3.5 w-3.5" />
            Academic Scope
          </p>
          <h2 className="mt-2 text-3xl font-bold text-[#233652]">{summary.totals.modules}</h2>
          <p className="mt-1 text-sm text-[#6b819f]">Modules across {summary.totals.groups} groups</p>
        </article>

        <article className="rounded-2xl border border-[#d7e1f0] bg-white p-5 shadow-sm">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#7188a9]">
            <GitCommitHorizontal className="h-3.5 w-3.5" />
            Repository Activity
          </p>
          <h2 className="mt-2 text-3xl font-bold text-[#233652]">{summary.totals.commits}</h2>
          <p className="mt-1 text-sm text-[#6b819f]">
            {summary.totals.repositories} repositories tracked
          </p>
        </article>

        <article className="rounded-2xl border border-[#f3d0d6] bg-[#fff9fb] p-5 shadow-sm">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#b74f60]">
            <ShieldAlert className="h-3.5 w-3.5" />
            Flagged Contributors
          </p>
          <h2 className="mt-2 text-3xl font-bold text-[#a13f50]">
            {summary.totals.flaggedContributors}
          </h2>
          <p className="mt-1 text-sm text-[#b76b79]">Needs cross-module review</p>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-2xl border border-[#d7e1f0] bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7188a9]">
                System Commit Activity
              </p>
              <h3 className="text-xl font-bold text-[#21344e]">Last 14 Days</h3>
            </div>
            <span className="rounded-full border border-[#d6e2f3] bg-[#f5f9ff] px-3 py-1 text-xs font-semibold text-[#5a7292]">
              Daily Commits
            </span>
          </div>

          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={summary.trends.commitActivity || []}>
                <CartesianGrid strokeDasharray="4 4" stroke="#dce6f4" />
                <XAxis dataKey="date" stroke="#6e839f" />
                <YAxis stroke="#6e839f" allowDecimals={false} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="commits"
                  stroke="#3f6ed0"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-2xl border border-[#d7e1f0] bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7188a9]">
                Role Distribution
              </p>
              <h3 className="text-xl font-bold text-[#21344e]">Current User Mix</h3>
            </div>
            <BarChart3 className="h-5 w-5 text-[#6f86a8]" />
          </div>

          <div className="h-[210px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roleDistribution}>
                <CartesianGrid strokeDasharray="4 4" stroke="#dce6f4" />
                <XAxis dataKey="role" stroke="#6e839f" />
                <YAxis stroke="#6e839f" allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" radius={[8, 8, 0, 0]} fill="#3f6ed0" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 grid gap-2">
            <p className="text-sm text-[#4f6787]">
              Recent user signups (14 days):{" "}
              <span className="font-semibold text-[#294567]">
                {(summary.trends.userSignups || []).reduce(
                  (sum, row) => sum + Number(row.users || 0),
                  0
                )}
              </span>
            </p>
            <p className="text-sm text-[#4f6787]">
              Total repositories tracked:{" "}
              <span className="font-semibold text-[#294567]">
                {summary.totals.repositories}
              </span>
            </p>
          </div>
        </article>
      </section>
    </div>
  );
}

export default AdminOverview;
