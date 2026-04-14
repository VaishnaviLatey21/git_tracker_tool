import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowUpRight,
  FileDown,
  FolderSearch2,
  GitBranch,
  Layers3,
  Link2,
  Link2Off,
  ShieldAlert,
  Users,
  UsersRound,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import axios from "../../api/axios";

const initialOverviewStats = {
  totalModules: 0,
  totalGroups: 0,
  repositories: 0,
  flaggedStudents: 0,
};

const initialRepoForm = { url: "", platform: "GITLAB" };

const getWeekStart = (date) => {
  const value = new Date(date);
  const day = (value.getDay() + 6) % 7;
  value.setDate(value.getDate() - day);
  value.setHours(0, 0, 0, 0);
  return value;
};

const buildTrendData = (contributors) => {
  if (!contributors?.length) return [];

  const weekly = new Map();

  contributors.forEach((student) => {
    (student.commits || []).forEach((commit) => {
      const commitDate = new Date(commit.timestamp);
      if (Number.isNaN(commitDate.getTime())) return;

      const weekStart = getWeekStart(commitDate);
      const key = weekStart.toISOString().slice(0, 10);

      if (!weekly.has(key)) {
        weekly.set(key, {
          key,
          week: weekStart.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
          }),
          commits: 0,
          lowQuality: 0,
          contributors: new Set(),
        });
      }

      const bucket = weekly.get(key);
      bucket.commits += 1;
      bucket.contributors.add(student.email || student.name);
      if (commit.isLowQuality || Number(commit.qualityScore || 0) < 60) {
        bucket.lowQuality += 1;
      }
    });
  });

  const sorted = Array.from(weekly.values()).sort((a, b) =>
    a.key.localeCompare(b.key)
  );

  return sorted.map((point, index, allPoints) => {
    const movingWindow = allPoints.slice(Math.max(0, index - 2), index + 1);
    const movingAverage =
      movingWindow.reduce((sum, item) => sum + item.commits, 0) /
      movingWindow.length;

    return {
      week: point.week,
      commits: point.commits,
      activeContributors: point.contributors.size,
      lowQuality: point.lowQuality,
      movingAverage: Number(movingAverage.toFixed(1)),
      qualityRatio: point.commits
        ? Number(((point.lowQuality / point.commits) * 100).toFixed(1))
        : 0,
    };
  });
};

const getTrendSummary = (trendData = []) => {
  if (!trendData.length) {
    return {
      totalCommits: 0,
      avgContributors: 0,
      avgQualityRisk: 0,
    };
  }

  const totalCommits = trendData.reduce((sum, point) => sum + point.commits, 0);
  const avgContributors =
    trendData.reduce((sum, point) => sum + point.activeContributors, 0) /
    trendData.length;
  const avgQualityRisk =
    trendData.reduce((sum, point) => sum + point.qualityRatio, 0) /
    trendData.length;

  return {
    totalCommits,
    avgContributors: Number(avgContributors.toFixed(1)),
    avgQualityRisk: Number(avgQualityRisk.toFixed(1)),
  };
};

const CustomTrendTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  const values = payload.reduce((acc, item) => {
    acc[item.dataKey] = item.value;
    return acc;
  }, {});

  return (
    <div className="conv-chart-tooltip">
      <p className="conv-chart-tooltip-title">Week of {label}</p>
      <p>Commits: {values.commits || 0}</p>
      <p>Active Contributors: {values.activeContributors || 0}</p>
      <p>Moving Avg (3 weeks): {values.movingAverage || 0}</p>
      <p>Low-quality Ratio: {values.qualityRatio || 0}%</p>
    </div>
  );
};

function Overview() {
  const navigate = useNavigate();

  const [stats, setStats] = useState(initialOverviewStats);
  const [modules, setModules] = useState([]);
  const [groups, setGroups] = useState([]);

  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");

  const [repositoriesByGroup, setRepositoriesByGroup] = useState({});
  const [contributorsByGroup, setContributorsByGroup] = useState({});

  const [repoDialogOpen, setRepoDialogOpen] = useState(false);
  const [repoTargetGroupId, setRepoTargetGroupId] = useState(null);
  const [repoForm, setRepoForm] = useState(initialRepoForm);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const [modulesRes, overviewRes] = await Promise.all([
          axios.get("/modules"),
          axios.get("/modules/overview"),
        ]);

        const allModules = modulesRes.data || [];
        setModules(allModules);
        setStats(overviewRes.data || initialOverviewStats);

        if (allModules.length > 0) {
          setSelectedModuleId(String(allModules[0].id));
        }
      } catch (error) {
        console.error("Failed loading overview data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
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
        const allGroups = response.data || [];
        setGroups(allGroups);
        setSelectedGroupId(allGroups[0] ? String(allGroups[0].id) : "");

        allGroups.forEach((group) => {
          loadGroupAnalytics(group.id);
        });
      } catch (error) {
        console.error("Failed to load groups:", error);
      }
    };

    loadGroups();
  }, [selectedModuleId]);

  const loadGroupAnalytics = async (groupId) => {
    try {
      const repoResponse = await axios.get(`/repositories/${groupId}`);
      const repository = repoResponse.data;

      setRepositoriesByGroup((prev) => ({ ...prev, [groupId]: repository }));

      if (!repository) {
        setContributorsByGroup((prev) => ({ ...prev, [groupId]: [] }));
        return;
      }

      const contributorResponse = await axios.get(
        `/repositories/contributors/${groupId}`
      );

      setContributorsByGroup((prev) => ({
        ...prev,
        [groupId]: contributorResponse.data || [],
      }));
    } catch (error) {
      if (error.response?.status === 404) {
        setRepositoriesByGroup((prev) => ({ ...prev, [groupId]: null }));
        setContributorsByGroup((prev) => ({ ...prev, [groupId]: [] }));
        return;
      }
      console.error(`Failed to load analytics for group ${groupId}:`, error);
    }
  };

  const selectedGroup = useMemo(
    () => groups.find((group) => String(group.id) === selectedGroupId),
    [groups, selectedGroupId]
  );

  const selectedContributors = useMemo(
    () => contributorsByGroup[selectedGroup?.id] || [],
    [contributorsByGroup, selectedGroup]
  );

  const trendData = useMemo(
    () => buildTrendData(selectedContributors),
    [selectedContributors]
  );
  const trendSummary = useMemo(() => getTrendSummary(trendData), [trendData]);

  const topStudents = useMemo(
    () =>
      [...selectedContributors]
        .sort((a, b) => Number(b.totalCommits || 0) - Number(a.totalCommits || 0))
        .slice(0, 6),
    [selectedContributors]
  );

  const openRepoDialog = (groupId) => {
    setRepoTargetGroupId(groupId);
    setRepoForm(initialRepoForm);
    setRepoDialogOpen(true);
  };

  const closeRepoDialog = () => {
    setRepoDialogOpen(false);
    setRepoTargetGroupId(null);
    setRepoForm(initialRepoForm);
  };

  const handleLinkRepository = async (event) => {
    event.preventDefault();
    if (!repoTargetGroupId || !repoForm.url.trim()) return;

    try {
      await axios.post("/repositories", {
        groupId: repoTargetGroupId,
        url: repoForm.url.trim(),
        platform: repoForm.platform || "GITLAB",
      });

      await loadGroupAnalytics(repoTargetGroupId);
      closeRepoDialog();
    } catch (error) {
      console.error("Failed to link repository:", error);
      alert("Unable to link repository. Please validate URL and platform.");
    }
  };

  const removeRepository = async (groupId) => {
    try {
      await axios.delete(`/repositories/${groupId}`);
      await loadGroupAnalytics(groupId);
    } catch (error) {
      console.error("Failed to unlink repository:", error);
      alert("Unable to unlink repository. Please try again.");
    }
  };

  const downloadGroupPDF = async (groupId) => {
    try {
      const response = await axios.get(`/reports/group/${groupId}/pdf`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = `group-${groupId}-report.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("PDF download failed:", error);
    }
  };

  if (loading) {
    return <div className="conv-card conv-empty">Loading dashboard analytics...</div>;
  }

  return (
    <div className="conv-page">
      <section className="mb-3">
        {/* <p className="conv-kicker">Convenor Dashboard</p> */}
        <h1 className="conv-hero-title">Git Repository Analytics</h1>
      </section>

      <section className="conv-grid-4">
        <article className="conv-stat-card">
          <div className="conv-stat-top">
            <p className="conv-kicker">Modules</p>
            <span className="conv-stat-icon">
              <Layers3 className="h-4 w-4" />
            </span>
          </div>
          <h2 className="conv-stat-value">{stats.totalModules}</h2>
          <p className="conv-stat-note">Configured academic modules</p>
        </article>
        <article className="conv-stat-card">
          <div className="conv-stat-top">
            <p className="conv-kicker">Groups</p>
            <span className="conv-stat-icon">
              <UsersRound className="h-4 w-4" />
            </span>
          </div>
          <h2 className="conv-stat-value">{stats.totalGroups}</h2>
          <p className="conv-stat-note">Active student teams</p>
        </article>
        <article className="conv-stat-card">
          <div className="conv-stat-top">
            <p className="conv-kicker">Linked Repositories</p>
            <span className="conv-stat-icon">
              <GitBranch className="h-4 w-4" />
            </span>
          </div>
          <h2 className="conv-stat-value">{stats.repositories}</h2>
          <p className="conv-stat-note">GitHub and GitLab sources</p>
        </article>
        <article className="conv-stat-card danger">
          <div className="conv-stat-top">
            <p className="conv-kicker danger">
              <ShieldAlert className="h-4 w-4" />
              Flagged Students
            </p>
            <span className="conv-stat-icon danger">
              <ShieldAlert className="h-4 w-4" />
            </span>
          </div>
          <h2 className="conv-stat-value danger">{stats.flaggedStudents}</h2>
          <p className="conv-stat-note danger">Needs convenor intervention</p>
        </article>
      </section>

      <section className="conv-card">
        <div className="conv-panel-header">
          <div>
            <p className="conv-kicker">Group Explorer</p>
            <h2 className="conv-panel-title">Consolidated Repository View</h2>
          </div>
          <button
            type="button"
            onClick={() => navigate("/convenor/modules")}
            className="conv-btn muted sm"
          >
            <FolderSearch2 className="h-3.5 w-3.5" />
            Manage Modules
          </button>
        </div>

        <div className="conv-fields-2">
          <label className="conv-field">
            <span className="conv-label">Module</span>
            <select
              value={selectedModuleId}
              onChange={(event) => setSelectedModuleId(event.target.value)}
              className="conv-select"
            >
              {modules.length === 0 && <option value="">No modules</option>}
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
              value={selectedGroupId}
              onChange={(event) => setSelectedGroupId(event.target.value)}
              className="conv-select"
            >
              {groups.length === 0 && <option value="">No groups</option>}
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="conv-group-grid">
          {groups.map((group) => {
            const repository = repositoriesByGroup[group.id];
            const contributors = contributorsByGroup[group.id] || [];
            const totalCommits = contributors.reduce(
              (sum, student) => sum + Number(student.totalCommits || 0),
              0
            );
            const isSelected = String(group.id) === selectedGroupId;

            return (
              <article
                key={group.id}
                className={`conv-group-card ${isSelected ? "is-selected" : ""}`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedGroupId(String(group.id))}
                  className="conv-group-card-head"
                >
                  <div className="conv-row">
                    <h3>{group.name}</h3>
                    <span className="conv-tag">
                      {repository ? repository.platform : "Not Linked"}
                    </span>
                  </div>
                  <p className="conv-meta">
                    {contributors.length} contributors · {totalCommits} commits
                  </p>
                </button>

                <div className="conv-actions">
                  <button
                    type="button"
                    onClick={() => navigate(`/convenor/groups/${group.id}`)}
                    className="conv-btn light sm"
                  >
                    Summary
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>

                  {repository ? (
                    <>
                      <button
                        type="button"
                        onClick={() => downloadGroupPDF(group.id)}
                        className="conv-btn light sm"
                      >
                        <FileDown className="h-3.5 w-3.5" />
                        PDF
                      </button>
                      <button
                        type="button"
                        onClick={() => removeRepository(group.id)}
                        className="conv-btn danger sm"
                      >
                        <Link2Off className="h-3.5 w-3.5" />
                        Unlink
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openRepoDialog(group.id)}
                      className="conv-btn primary sm"
                    >
                      <Link2 className="h-3.5 w-3.5" />
                      Link Repo
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="conv-card">
        <div className="conv-panel-header">
          <div>
            <p className="conv-kicker">Student Contribution</p>
            <h2 className="conv-panel-title">
              {selectedGroup ? selectedGroup.name : "No group selected"}
            </h2>
          </div>
          <span className="conv-chip">
            <Activity className="h-3.5 w-3.5" />
            Weekly Trend
          </span>
        </div>

        <div className="conv-contrib-grid">
          <div className="conv-mini-table">
            <div className="conv-mini-head">
              <span>Student</span>
              <span>Commits</span>
              <span>Share</span>
            </div>

            {topStudents.length === 0 && (
              <p className="conv-empty subtle">
                Link repository to visualize contributions.
              </p>
            )}

            {topStudents.map((student) => (
              <div key={student.email} className="conv-mini-row">
                <span className="name">
                  <Users className="h-3.5 w-3.5" />
                  {student.name}
                </span>
                <span>{student.totalCommits}</span>
                <span>{student.contributionPercentage}%</span>
              </div>
            ))}
          </div>

          <div className="conv-chart-box">
            <div className="conv-trend-metrics">
              <span>Total commits: {trendSummary.totalCommits}</span>
              <span>Avg active contributors: {trendSummary.avgContributors}</span>
              <span>Avg low-quality ratio: {trendSummary.avgQualityRisk}%</span>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="convTrendCommits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2c7cc7" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#2c7cc7" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient
                    id="convTrendContributors"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#17a79b" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#17a79b" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="#dce7f5" />
                <XAxis dataKey="week" stroke="#6e839f" />
                <YAxis yAxisId="left" stroke="#4f6785" allowDecimals={false} />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#4f6785"
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTrendTooltip />} />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="commits"
                  stroke="#2c7cc7"
                  strokeWidth={2.4}
                  fill="url(#convTrendCommits)"
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="activeContributors"
                  stroke="#17a79b"
                  strokeWidth={2}
                  fill="url(#convTrendContributors)"
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="movingAverage"
                  stroke="#c78a2b"
                  strokeWidth={2}
                  dot={false}
                  strokeDasharray="7 4"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {repoDialogOpen && (
        <div className="conv-modal-backdrop">
          <form onSubmit={handleLinkRepository} className="conv-modal conv-modal-md">
            <div className="conv-modal-header">
              <div>
                <h3 className="conv-modal-title">Link Repository</h3>
                <p className="conv-modal-subtitle">
                  Connect GitHub or GitLab repository for this group.
                </p>
              </div>
            </div>

            <div className="conv-modal-body">
              <label className="conv-field">
                <span className="conv-label">Repository URL</span>
                <input
                  type="url"
                  required
                  value={repoForm.url}
                  onChange={(event) =>
                    setRepoForm((prev) => ({ ...prev, url: event.target.value }))
                  }
                  className="conv-input"
                  placeholder="https://gitlab.com/org/repository"
                />
              </label>

              <label className="conv-field">
                <span className="conv-label">Platform</span>
                <select
                  value={repoForm.platform}
                  onChange={(event) =>
                    setRepoForm((prev) => ({ ...prev, platform: event.target.value }))
                  }
                  className="conv-select"
                >
                  <option value="GITLAB">GitLab</option>
                  <option value="GITHUB">GitHub</option>
                </select>
              </label>
            </div>

            <div className="conv-modal-footer">
              <button type="button" onClick={closeRepoDialog} className="conv-btn muted">
                Cancel
              </button>
              <button type="submit" className="conv-btn primary">
                Save Link
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default Overview;
