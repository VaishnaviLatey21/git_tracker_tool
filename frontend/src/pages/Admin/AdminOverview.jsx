import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  BellRing,
  Database,
  GitCommitHorizontal,
  MessageSquare,
  Users,
} from "lucide-react";
import { useOutletContext } from "react-router-dom";
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
  const { unreadSupportCount = 0, supportNotifications = [], openSupportInbox } =
    useOutletContext() || {};
  const [summary, setSummary] = useState(fallbackSummary);
  const [loading, setLoading] = useState(true);
  const [timeWindowDays, setTimeWindowDays] = useState("14");
  const [moduleScope, setModuleScope] = useState("ALL");
  const [groupScope, setGroupScope] = useState("ALL");

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

  const commitSeries = useMemo(() => {
    const windowDays = Number.parseInt(timeWindowDays, 10) || 14;
    return (summary.trends.commitActivity || []).slice(-windowDays);
  }, [summary.trends.commitActivity, timeWindowDays]);

  if (loading) {
    return <div className="rounded-2xl border border-[#d7e1f0] bg-white p-6">Loading admin summary...</div>;
  }

  return (
    <div className="admin-page space-y-6">
      <section className="admin-surface rounded-2xl border border-[#d7e1f0] bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-4">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#6f86a6]">Module</span>
            <select
              className="w-full rounded-lg border border-[#d6e0ef] bg-white px-3 py-2 text-sm text-[#2a3f60]"
              value={moduleScope}
              onChange={(event) => setModuleScope(event.target.value)}
            >
              <option value="ALL">All Modules</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#6f86a6]">Group</span>
            <select
              className="w-full rounded-lg border border-[#d6e0ef] bg-white px-3 py-2 text-sm text-[#2a3f60]"
              value={groupScope}
              onChange={(event) => setGroupScope(event.target.value)}
            >
              <option value="ALL">All Groups</option>
            </select>
          </label>
          <label className="block md:col-span-2">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#6f86a6]">Time Window</span>
            <select
              className="w-full rounded-lg border border-[#d6e0ef] bg-white px-3 py-2 text-sm text-[#2a3f60]"
              value={timeWindowDays}
              onChange={(event) => setTimeWindowDays(event.target.value)}
            >
              <option value="7">Last 7 days</option>
              <option value="14">Last 14 days</option>
              <option value="30">Last 30 days</option>
            </select>
          </label>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <article className="admin-surface rounded-2xl border border-[#d7e1f0] bg-white p-5 shadow-sm">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#7188a9]">
            <Users className="h-3.5 w-3.5" />
            Users
          </p>
          <h2 className="mt-2 text-3xl font-bold text-[#233652]">{summary.totals.users}</h2>
          <p className="mt-1 text-sm text-[#6b819f]">
            Verified: {summary.totals.verifiedUsers}
          </p>
        </article>

        <article className="admin-surface rounded-2xl border border-[#d7e1f0] bg-white p-5 shadow-sm">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#7188a9]">
            <Database className="h-3.5 w-3.5" />
            Convenors
          </p>
          <h2 className="mt-2 text-3xl font-bold text-[#233652]">{summary.usersByRole.CONVENOR || 0}</h2>
          <p className="mt-1 text-sm text-[#6b819f]">Active module convenors</p>
        </article>

        <article className="admin-surface rounded-2xl border border-[#d7e1f0] bg-white p-5 shadow-sm">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#7188a9]">
            <GitCommitHorizontal className="h-3.5 w-3.5" />
            Modules
          </p>
          <h2 className="mt-2 text-3xl font-bold text-[#233652]">{summary.totals.modules}</h2>
          <p className="mt-1 text-sm text-[#6b819f]">Total modules</p>
        </article>

        <article className="admin-surface rounded-2xl border border-[#d7e1f0] bg-white p-5 shadow-sm">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#7188a9]">
            <Users className="h-3.5 w-3.5" />
            Groups
          </p>
          <h2 className="mt-2 text-3xl font-bold text-[#233652]">{summary.totals.groups}</h2>
          <p className="mt-1 text-sm text-[#6b819f]">Total groups</p>
        </article>

        <article className="admin-surface rounded-2xl border border-[#d7e1f0] bg-white p-5 shadow-sm">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#7188a9]">
            <Database className="h-3.5 w-3.5" />
            Repositories
          </p>
          <h2 className="mt-2 text-3xl font-bold text-[#233652]">{summary.totals.repositories}</h2>
          <p className="mt-1 text-sm text-[#6b819f]">Linked repositories</p>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="admin-surface rounded-2xl border border-[#d7e1f0] bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7188a9]">
                System Commit Activity
              </p>
              <h3 className="text-xl font-bold text-[#21344e]">Last {timeWindowDays} Days</h3>
            </div>
            <span className="rounded-full border border-[#d6e2f3] bg-[#f5f9ff] px-3 py-1 text-xs font-semibold text-[#5a7292]">
              Daily Commits
            </span>
          </div>

          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={commitSeries}>
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

        <article className="admin-surface rounded-2xl border border-[#d7e1f0] bg-white p-5 shadow-sm">
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

      <section className="admin-surface rounded-2xl border border-[#d7e1f0] bg-white p-5 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7188a9]">
              Notifications
            </p>
            <h3 className="text-xl font-bold text-[#21344e]">
              Convenor Support Queue
            </h3>
          </div>
          <button
            type="button"
            onClick={() => openSupportInbox?.()}
            className="inline-flex items-center gap-2 rounded-lg border border-[#cedcef] bg-[#eff5ff] px-3 py-2 text-sm font-semibold text-[#365988]"
          >
            <MessageSquare className="h-4 w-4" />
            Open Inbox
          </button>
        </div>

        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#d7e2f2] bg-[#f7faff] px-3 py-1 text-xs font-semibold text-[#4f6787]">
          <BellRing className="h-3.5 w-3.5" />
          Unread convenor messages: {unreadSupportCount}
        </div>

        <div className="space-y-2">
          {supportNotifications.length === 0 && (
            <p className="rounded-lg border border-dashed border-[#d7e1f0] bg-[#f9fbff] px-3 py-2 text-sm text-[#5f7698]">
              No unread messages at the moment.
            </p>
          )}

          {supportNotifications.slice(0, 5).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => openSupportInbox?.(item.threadId)}
              className="w-full rounded-xl border border-[#dce6f4] bg-[#fafcff] px-3 py-2 text-left transition hover:border-[#a7c0e4] hover:bg-[#f3f8ff]"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-[#274164]">{item.threadSubject}</p>
                <span className="text-[11px] text-[#7d92af]">
                  {new Date(item.createdAt).toLocaleString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <p className="mt-1 text-xs font-semibold text-[#5f7899]">
                {item.convenorName} ({item.convenorEmail})
              </p>
              <p className="mt-1 line-clamp-2 text-sm text-[#4f6787]">{item.message}</p>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

export default AdminOverview;
