import { useEffect, useMemo, useState } from "react";
import { Activity, CalendarRange, Filter, Users } from "lucide-react";
import {
  Area,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import axios from "../../api/axios";

const formatDateInput = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const buildRange = () => {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 29);

  return {
    startDate: formatDateInput(start),
    endDate: formatDateInput(end),
  };
};

const inDateRange = (timestamp, start, end) => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return false;
  if (start && date < new Date(`${start}T00:00:00`)) return false;
  if (end && date > new Date(`${end}T23:59:59`)) return false;
  return true;
};

function ConvenorAnalytics() {
  const [modules, setModules] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [contributors, setContributors] = useState([]);
  const [dateRange, setDateRange] = useState(buildRange);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadModules = async () => {
      setLoading(true);
      try {
        const modulesRes = await axios.get("/modules");
        const rows = modulesRes.data || [];
        setModules(rows);
        if (rows[0]) {
          setSelectedModuleId(String(rows[0].id));
        }
      } catch (error) {
        console.error("Failed to load modules:", error);
      } finally {
        setLoading(false);
      }
    };

    loadModules();
  }, []);

  useEffect(() => {
    if (!selectedModuleId) {
      setGroups([]);
      setSelectedGroupId("");
      return;
    }

    const loadGroups = async () => {
      try {
        const response = await axios.get(`/groups/module/${selectedModuleId}`);
        const rows = response.data || [];
        setGroups(rows);
        setSelectedGroupId(rows[0] ? String(rows[0].id) : "");
      } catch (error) {
        console.error("Failed to load groups:", error);
      }
    };

    loadGroups();
  }, [selectedModuleId]);

  useEffect(() => {
    if (!selectedGroupId) {
      setContributors([]);
      return;
    }

    const loadContributors = async () => {
      try {
        const response = await axios.get(`/repositories/contributors/${selectedGroupId}`);
        setContributors(response.data || []);
      } catch (error) {
        if (error.response?.status === 404) {
          setContributors([]);
          return;
        }
        console.error("Failed to load contributors:", error);
      }
    };

    loadContributors();
  }, [selectedGroupId]);

  const filteredContributors = useMemo(() => {
    return (contributors || []).map((contributor) => {
      const commits = (contributor.commits || []).filter((commit) =>
        inDateRange(commit.timestamp, dateRange.startDate, dateRange.endDate)
      );

      const totalCommits = commits.length;
      const lowQualityCommits = commits.filter((commit) => commit.isLowQuality).length;

      return {
        ...contributor,
        commits,
        totalCommits,
        lowQualityCommits,
      };
    });
  }, [contributors, dateRange.endDate, dateRange.startDate]);

  const totalCommits = useMemo(
    () => filteredContributors.reduce((sum, row) => sum + Number(row.totalCommits || 0), 0),
    [filteredContributors]
  );

  const activeStudents = useMemo(
    () => filteredContributors.filter((row) => Number(row.totalCommits || 0) > 0).length,
    [filteredContributors]
  );

  const trendData = useMemo(() => {
    const buckets = new Map();

    filteredContributors.forEach((contributor) => {
      (contributor.commits || []).forEach((commit) => {
        const key = new Date(commit.timestamp).toISOString().slice(0, 10);
        buckets.set(key, (buckets.get(key) || 0) + 1);
      });
    });

    const sorted = Array.from(buckets.entries())
      .map(([date, commits]) => ({ date, commits }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return sorted.map((row, index) => {
      const windowRows = sorted.slice(Math.max(0, index - 2), index + 1);
      const rollingAverage =
        windowRows.reduce((sum, item) => sum + Number(item.commits || 0), 0) /
        windowRows.length;

      return {
        ...row,
        rollingAverage: Number(rollingAverage.toFixed(1)),
      };
    });
  }, [filteredContributors]);

  const tableRows = useMemo(() => {
    const rows = [...filteredContributors];
    rows.sort((a, b) => Number(b.totalCommits || 0) - Number(a.totalCommits || 0));

    return rows.map((row) => ({
      ...row,
      share: totalCommits ? ((Number(row.totalCommits || 0) / totalCommits) * 100).toFixed(1) : "0.0",
    }));
  }, [filteredContributors, totalCommits]);

  if (loading) {
    return <div className="conv-card conv-empty">Loading analytics...</div>;
  }

  return (
    <div className="conv-page">
      <section className="conv-card">
        <div className="conv-panel-header">
          <div>
            <p className="conv-kicker">Analytics</p>
            <h1 className="conv-panel-title">Student Contribution Analytics</h1>
            <p className="conv-panel-subtitle">Track contribution trend by module, group and date range.</p>
          </div>
          <span className="conv-chip">
            <Activity className="h-3.5 w-3.5" />
            Evidence View
          </span>
        </div>

        <div className="conv-top-filters">
          <label className="conv-field">
            <span className="conv-label">Module</span>
            <select
              className="conv-select"
              value={selectedModuleId}
              onChange={(event) => setSelectedModuleId(event.target.value)}
            >
              {modules.map((module) => (
                <option key={module.id} value={module.id}>
                  {module.name} ({module.year})
                </option>
              ))}
            </select>
          </label>

          <label className="conv-field">
            <span className="conv-label">Group</span>
            <select
              className="conv-select"
              value={selectedGroupId}
              onChange={(event) => setSelectedGroupId(event.target.value)}
            >
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </label>

          <label className="conv-field">
            <span className="conv-label">Start Date</span>
            <input
              className="conv-input"
              type="date"
              value={dateRange.startDate}
              onChange={(event) =>
                setDateRange((prev) => ({ ...prev, startDate: event.target.value }))
              }
            />
          </label>

          <label className="conv-field">
            <span className="conv-label">End Date</span>
            <input
              className="conv-input"
              type="date"
              value={dateRange.endDate}
              onChange={(event) =>
                setDateRange((prev) => ({ ...prev, endDate: event.target.value }))
              }
            />
          </label>
        </div>
      </section>

      <section className="conv-grid-3">
        <article className="conv-stat-card">
          <p className="conv-kicker">Total Commits</p>
          <h2 className="conv-stat-value">{totalCommits}</h2>
        </article>
        <article className="conv-stat-card">
          <p className="conv-kicker">Active Students</p>
          <h2 className="conv-stat-value">{activeStudents}</h2>
        </article>
        <article className="conv-stat-card">
          <p className="conv-kicker">Selected Window</p>
          <h2 className="conv-stat-value" style={{ fontSize: "1.2rem" }}>
            <CalendarRange className="inline h-4 w-4" /> {dateRange.startDate || "-"} to {dateRange.endDate || "-"}
          </h2>
        </article>
      </section>

      <section className="conv-card">
        <div className="conv-panel-header compact">
          <div>
            <p className="conv-kicker">Activity Over Time</p>
            <h2 className="conv-panel-title small">Commits Trend</h2>
          </div>
        </div>

        <div className="conv-chart-box" style={{ height: 320 }}>
          {trendData.length === 0 ? (
            <div className="conv-empty subtle">No commit activity found for selected filters.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <defs>
                  <linearGradient id="commitGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2f6fca" stopOpacity={0.36} />
                    <stop offset="95%" stopColor="#2f6fca" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#dce6f3" />
                <XAxis dataKey="date" stroke="#7087a4" />
                <YAxis allowDecimals={false} stroke="#7087a4" />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="commits"
                  stroke="none"
                  fill="url(#commitGradient)"
                />
                <Line
                  type="monotone"
                  dataKey="commits"
                  stroke="#2f6fca"
                  strokeWidth={2.8}
                  dot={false}
                  activeDot={{ r: 4.5 }}
                  strokeLinecap="round"
                />
                <Line
                  type="monotone"
                  dataKey="rollingAverage"
                  name="3-point average"
                  stroke="#18a58d"
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section className="conv-card">
        <div className="conv-panel-header compact">
          <div>
            <p className="conv-kicker">Contributors</p>
            <h2 className="conv-panel-title small">Student Contribution Breakdown</h2>
          </div>
          <span className="conv-chip">
            <Filter className="h-3.5 w-3.5" />
            Sorted by commits
          </span>
        </div>

        <div className="conv-table-wrap">
          <table className="conv-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Email</th>
                <th>Commits</th>
                <th>Share</th>
                <th>Low Quality</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.length === 0 && (
                <tr>
                  <td colSpan={6}>No contributor records for selected filters.</td>
                </tr>
              )}
              {tableRows.map((row) => (
                <tr key={row.email || row.name}>
                  <td className="strong">
                    <Users className="mr-1 inline h-3.5 w-3.5" /> {row.name}
                  </td>
                  <td>{row.email}</td>
                  <td>{row.totalCommits}</td>
                  <td>{row.share}%</td>
                  <td>{row.lowQualityCommits}</td>
                  <td>
                    {row.totalCommits > 0 ? (
                      <span className="conv-badge success">Active</span>
                    ) : (
                      <span className="conv-badge warning">Inactive</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default ConvenorAnalytics;
