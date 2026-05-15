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
  MessageSquarePlus,
  SendHorizontal,
  ShieldAlert,
  Users,
  UsersRound,
} from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
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
  activeStudents: 0,
};

const initialRepoForm = { url: "", platform: "GITLAB" };

const formatDateInput = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const getDefaultDateRange = () => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 29);

  return {
    startDate: formatDateInput(startDate),
    endDate: formatDateInput(endDate),
  };
};

const isInDateRange = (timestamp, startDate, endDate) => {
  const value = new Date(timestamp);
  if (Number.isNaN(value.getTime())) return false;

  if (startDate && value < new Date(`${startDate}T00:00:00`)) return false;
  if (endDate && value > new Date(`${endDate}T23:59:59`)) return false;
  return true;
};

const getWeekStart = (date) => {
  const value = new Date(date);
  const day = (value.getDay() + 6) % 7;
  value.setDate(value.getDate() - day);
  value.setHours(0, 0, 0, 0);
  return value;
};

const getContributorKey = (contributor) =>
  `${String(contributor?.email || "").trim().toLowerCase()}::${String(
    contributor?.name || ""
  )
    .trim()
    .toLowerCase()}`;

const buildTrendSeries = (contributors, maxStudentLines = 2) => {
  if (!contributors?.length) return { data: [], studentLines: [] };

  const palette = ["#4f7fd1", "#1da39a", "#b874d6", "#ea9b5f"];
  const topStudentLines = [...contributors]
    .sort((a, b) => Number(b.totalCommits || 0) - Number(a.totalCommits || 0))
    .slice(0, maxStudentLines)
    .map((contributor, index) => ({
      key: `studentLine${index + 1}`,
      label: contributor.name || `Student ${index + 1}`,
      color: palette[index % palette.length],
      contributorKey: getContributorKey(contributor),
    }));

  const studentLineLookup = new Map(
    topStudentLines.map((line) => [line.contributorKey, line.key])
  );

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
          ...Object.fromEntries(topStudentLines.map((line) => [line.key, 0])),
        });
      }

      const bucket = weekly.get(key);
      bucket.commits += 1;
      bucket.contributors.add(student.email || student.name);
      if (commit.isLowQuality || Number(commit.qualityScore || 0) < 60) {
        bucket.lowQuality += 1;
      }

      const studentLineKey = studentLineLookup.get(getContributorKey(student));
      if (studentLineKey) {
        bucket[studentLineKey] += 1;
      }
    });
  });

  const sorted = Array.from(weekly.values()).sort((a, b) =>
    a.key.localeCompare(b.key)
  );

  const data = sorted.map((point, index, allPoints) => {
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
      ...Object.fromEntries(topStudentLines.map((line) => [line.key, point[line.key]])),
    };
  });

  return {
    data,
    studentLines: topStudentLines.map((line) => ({
      key: line.key,
      label: line.label,
      color: line.color,
    })),
  };
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

const buildRecentWeeks = (weeks = 8) => {
  const now = new Date();
  const currentWeek = getWeekStart(now);

  const rows = [];
  for (let offset = weeks - 1; offset >= 0; offset -= 1) {
    const weekStart = new Date(currentWeek);
    weekStart.setDate(currentWeek.getDate() - offset * 7);
    rows.push({
      key: weekStart.toISOString().slice(0, 10),
      label: weekStart.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
      }),
    });
  }

  return rows;
};

const buildCohortHeatmap = (contributors = [], weeks = 8) => {
  const weekColumns = buildRecentWeeks(weeks);

  const rows = [...contributors]
    .sort((a, b) => Number(b.totalCommits || 0) - Number(a.totalCommits || 0))
    .slice(0, 12)
    .map((contributor) => {
      const counts = new Map();

      (contributor.commits || []).forEach((commit) => {
        const commitDate = new Date(commit.timestamp);
        if (Number.isNaN(commitDate.getTime())) return;

        const weekStart = getWeekStart(commitDate);
        const key = weekStart.toISOString().slice(0, 10);
        counts.set(key, (counts.get(key) || 0) + 1);
      });

      const cells = weekColumns.map((week) => counts.get(week.key) || 0);

      return {
        name: contributor.name,
        email: contributor.email,
        totalCommits: contributor.totalCommits,
        cells,
      };
    });

  const maxCount = rows.reduce((max, row) => {
    const rowMax = row.cells.reduce((innerMax, value) => Math.max(innerMax, value), 0);
    return Math.max(max, rowMax);
  }, 0);

  return {
    weekColumns,
    rows,
    maxCount,
  };
};

const getHeatIntensityClass = (count, maxCount) => {
  if (!count || !maxCount) return "level-0";
  const ratio = count / maxCount;
  if (ratio >= 0.75) return "level-4";
  if (ratio >= 0.5) return "level-3";
  if (ratio >= 0.25) return "level-2";
  return "level-1";
};

const CustomTrendTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  const row = payload[0]?.payload || {};
  const stats = payload.filter((entry) => Number.isFinite(Number(entry?.value)));

  return (
    <div className="conv-chart-tooltip">
      <p className="conv-chart-tooltip-title">Week of {label}</p>
      {stats.map((entry) => (
        <p key={`${entry.name}-${entry.dataKey}`}>
          {entry.name}: {entry.value}
        </p>
      ))}
      <p>Low-quality ratio: {row.qualityRatio || 0}%</p>
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
  const [supportThreads, setSupportThreads] = useState([]);
  const [supportSubject, setSupportSubject] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const [supportSending, setSupportSending] = useState(false);
  const [supportError, setSupportError] = useState("");
  const [supportSuccess, setSupportSuccess] = useState("");
  const [dateRange, setDateRange] = useState(getDefaultDateRange);

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

  const loadSupportThreads = async () => {
    try {
      const response = await axios.get("/support/convenor/threads");
      setSupportThreads(response.data || []);
    } catch (error) {
      console.error("Failed to load support threads:", error);
    }
  };

  useEffect(() => {
    loadSupportThreads();
    const intervalId = window.setInterval(loadSupportThreads, 30000);
    return () => window.clearInterval(intervalId);
  }, []);

  const selectedGroup = useMemo(
    () => groups.find((group) => String(group.id) === selectedGroupId),
    [groups, selectedGroupId]
  );

  const selectedContributors = useMemo(
    () => contributorsByGroup[selectedGroup?.id] || [],
    [contributorsByGroup, selectedGroup]
  );

  const filteredSelectedContributors = useMemo(
    () =>
      (selectedContributors || []).map((contributor) => {
        const commits = (contributor.commits || []).filter((commit) =>
          isInDateRange(commit.timestamp, dateRange.startDate, dateRange.endDate)
        );

        return {
          ...contributor,
          commits,
          totalCommits: commits.length,
          lowQualityCommits: commits.filter((commit) => commit.isLowQuality).length,
        };
      }),
    [selectedContributors, dateRange.endDate, dateRange.startDate]
  );

  const trendSeries = useMemo(
    () => buildTrendSeries(filteredSelectedContributors),
    [filteredSelectedContributors]
  );
  const trendData = trendSeries.data;
  const trendStudentLines = trendSeries.studentLines;
  const trendSummary = useMemo(() => getTrendSummary(trendData), [trendData]);

  const topStudents = useMemo(
    () =>
      [...filteredSelectedContributors]
        .sort((a, b) => Number(b.totalCommits || 0) - Number(a.totalCommits || 0))
        .slice(0, 6),
    [filteredSelectedContributors]
  );

  const heatmap = useMemo(
    () => buildCohortHeatmap(filteredSelectedContributors, 8),
    [filteredSelectedContributors]
  );

  const groupComparisonRows = useMemo(() => {
    const rows = groups.map((group) => {
      const contributors = contributorsByGroup[group.id] || [];
      const repository = repositoriesByGroup[group.id];

      const totalCommits = contributors.reduce(
        (sum, contributor) => sum + Number(contributor.totalCommits || 0),
        0
      );
      const lowQualityCommits = contributors.reduce(
        (sum, contributor) => sum + Number(contributor.lowQualityCommits || 0),
        0
      );
      const inactivityStudents = contributors.filter(
        (contributor) => contributor.inactivityFlag
      ).length;
      const belowExpectedStudents = contributors.filter(
        (contributor) => contributor.belowExpectedCommits
      ).length;
      const deadlineSpikes = contributors.filter(
        (contributor) => contributor.deadlineSpike
      ).length;

      const lowQualityRatio = totalCommits
        ? Number(((lowQualityCommits / totalCommits) * 100).toFixed(1))
        : 0;

      const riskScore =
        belowExpectedStudents * 4 +
        inactivityStudents * 3 +
        deadlineSpikes * 2 +
        Math.ceil(lowQualityRatio / 10) +
        (repository ? 0 : 2);

      return {
        groupId: group.id,
        groupName: group.name,
        repositoryLinked: Boolean(repository),
        totalCommits,
        lowQualityRatio,
        inactivityStudents,
        belowExpectedStudents,
        deadlineSpikes,
        riskScore,
      };
    });

    return rows.sort((a, b) => b.riskScore - a.riskScore);
  }, [groups, contributorsByGroup, repositoriesByGroup]);

  const activeStudentsCount = useMemo(() => {
    const uniqueActive = new Set();

    Object.values(contributorsByGroup || {}).forEach((contributors) => {
      (contributors || []).forEach((contributor) => {
        if (Number(contributor.totalCommits || 0) > 0) {
          uniqueActive.add(String(contributor.email || contributor.name));
        }
      });
    });

    return uniqueActive.size;
  }, [contributorsByGroup]);

  const setContributionDatePreset = (days) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - Math.max(0, Number(days) - 1));
    setDateRange({
      startDate: formatDateInput(startDate),
      endDate: formatDateInput(endDate),
    });
  };

  const handleContributionDateChange = (key, value) => {
    setDateRange((prev) => ({ ...prev, [key]: value }));
  };

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

  const submitSupportQuestion = async (event) => {
    event.preventDefault();
    const message = supportMessage.trim();
    if (!message) {
      setSupportError("Please enter your message before sending.");
      setSupportSuccess("");
      return;
    }

    setSupportSending(true);
    setSupportError("");
    setSupportSuccess("");

    try {
      const subject =
        supportSubject.trim() ||
        (selectedGroup ? `Question about ${selectedGroup.name}` : "General Question");

      await axios.post("/support/convenor/questions", {
        subject,
        message,
      });

      setSupportSubject("");
      setSupportMessage("");
      setSupportSuccess("Question sent to admin. You will receive replies in notifications and chat.");
      await loadSupportThreads();
    } catch (error) {
      console.error("Failed to submit support question:", error);
      setSupportError(error.response?.data?.message || "Failed to send your question");
    } finally {
      setSupportSending(false);
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
        <article className="conv-stat-card">
          <div className="conv-stat-top">
            <p className="conv-kicker">
              <Users className="h-4 w-4" />
              Active Students
            </p>
            <span className="conv-stat-icon">
              <Users className="h-4 w-4" />
            </span>
          </div>
          <h2 className="conv-stat-value">{stats.activeStudents || activeStudentsCount}</h2>
          <p className="conv-stat-note">Contributors active in selected scope</p>
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
          <div className="conv-analytics-toolbar">
            <span className="conv-chip">
              <Activity className="h-3.5 w-3.5" />
              Weekly Trend
            </span>
            <div className="conv-inline-filters">
              <label className="conv-inline-filter">
                <span>From</span>
                <input
                  type="date"
                  value={dateRange.startDate}
                  max={dateRange.endDate || undefined}
                  onChange={(event) =>
                    handleContributionDateChange("startDate", event.target.value)
                  }
                  className="conv-input conv-input-compact"
                />
              </label>
              <label className="conv-inline-filter">
                <span>To</span>
                <input
                  type="date"
                  value={dateRange.endDate}
                  min={dateRange.startDate || undefined}
                  onChange={(event) =>
                    handleContributionDateChange("endDate", event.target.value)
                  }
                  className="conv-input conv-input-compact"
                />
              </label>
              <button
                type="button"
                onClick={() => setContributionDatePreset(30)}
                className="conv-btn light sm"
              >
                Last 30 Days
              </button>
              <button
                type="button"
                onClick={() => setContributionDatePreset(90)}
                className="conv-btn light sm"
              >
                Last 90 Days
              </button>
            </div>
          </div>
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
            {trendData.length === 0 ? (
              <p className="conv-empty subtle">No commits found for the selected date range.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={trendData}
                  margin={{ top: 10, right: 16, left: 8, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="4 4" stroke="#dce7f5" />
                  <XAxis dataKey="week" stroke="#6e839f" />
                  <YAxis yAxisId="left" stroke="#4f6785" allowDecimals={false} />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#6280a3"
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTrendTooltip />} />
                  <Legend verticalAlign="top" height={26} iconType="line" />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="commits"
                    name="Total Commits"
                    stroke="#2c7cc7"
                    strokeWidth={3}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="activeContributors"
                    name="Active Students"
                    stroke="#1f9f89"
                    strokeWidth={2.4}
                    dot={{ r: 2.6 }}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="lowQuality"
                    name="Low-quality Commits"
                    stroke="#d77b42"
                    strokeWidth={2.2}
                    dot={{ r: 2.2 }}
                  />
                  {trendStudentLines.map((line) => (
                    <Line
                      key={line.key}
                      yAxisId="left"
                      type="monotone"
                      dataKey={line.key}
                      name={`${line.label} commits`}
                      stroke={line.color}
                      strokeWidth={1.9}
                      dot={false}
                      strokeDasharray="6 4"
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="conv-heatmap-wrap">
          <div className="conv-panel-header compact">
            <div>
              <p className="conv-kicker">Cohort Heatmap</p>
              <h3 className="conv-panel-title small">
                Students vs Weeks Activity Intensity
              </h3>
            </div>
          </div>

          {heatmap.rows.length === 0 ? (
            <div className="conv-empty subtle">
              No cohort activity yet for heatmap view.
            </div>
          ) : (
            <div className="conv-heatmap-table">
              <div className="conv-heatmap-head">
                <span>Student</span>
                {heatmap.weekColumns.map((column) => (
                  <span key={`head-${column.key}`}>{column.label}</span>
                ))}
              </div>
              {heatmap.rows.map((row) => (
                <div key={`row-${row.email}`} className="conv-heatmap-row">
                  <span className="student-name" title={row.email}>
                    {row.name}
                  </span>
                  {row.cells.map((count, index) => (
                    <span
                      key={`${row.email}-${heatmap.weekColumns[index].key}`}
                      className={`conv-heatmap-cell ${getHeatIntensityClass(
                        count,
                        heatmap.maxCount
                      )}`}
                      title={`${row.name} - ${heatmap.weekColumns[index].label}: ${count} commits`}
                    >
                      {count}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="conv-card">
        <div className="conv-panel-header">
          <div>
            <p className="conv-kicker">Group Comparison Board</p>
            <h2 className="conv-panel-title">Risk & Contribution Ranking</h2>
          </div>
          <span className="conv-chip">
            <ShieldAlert className="h-3.5 w-3.5" />
            Ranked by risk score
          </span>
        </div>

        {groupComparisonRows.length === 0 ? (
          <div className="conv-empty subtle">
            No group comparison data available yet.
          </div>
        ) : (
          <div className="conv-table-wrap">
            <table className="conv-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Group</th>
                  <th>Repo</th>
                  <th>Commits</th>
                  <th>Low-quality Ratio</th>
                  <th>Below Expected</th>
                  <th>Inactivity</th>
                  <th>Spikes</th>
                  <th>Risk Score</th>
                </tr>
              </thead>
              <tbody>
                {groupComparisonRows.map((row, index) => (
                  <tr key={`comparison-${row.groupId}`}>
                    <td className="strong">#{index + 1}</td>
                    <td className="strong">{row.groupName}</td>
                    <td>
                      {row.repositoryLinked ? (
                        <span className="conv-badge success">Linked</span>
                      ) : (
                        <span className="conv-badge warning">Missing</span>
                      )}
                    </td>
                    <td>{row.totalCommits}</td>
                    <td>{row.lowQualityRatio}%</td>
                    <td>{row.belowExpectedStudents}</td>
                    <td>{row.inactivityStudents}</td>
                    <td>{row.deadlineSpikes}</td>
                    <td>
                      <span
                        className={`conv-badge ${
                          row.riskScore >= 8
                            ? "warning"
                            : row.riskScore >= 4
                              ? "purple"
                              : "success"
                        }`}
                      >
                        {row.riskScore}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="conv-card">
        <div className="conv-panel-header">
          <div>
            <p className="conv-kicker">Message Admin</p>
            <h2 className="conv-panel-title">Convenor Support Desk</h2>
            <p className="conv-panel-subtitle">
              Ask project or analytics questions and track responses from admin.
            </p>
          </div>
          <span className="conv-chip">
            <MessageSquarePlus className="h-3.5 w-3.5" />
            Live Support
          </span>
        </div>

        <div className="conv-two-col">
          <form onSubmit={submitSupportQuestion} className="conv-stack">
            <label className="conv-field">
              <span className="conv-label">Subject (optional)</span>
              <input
                type="text"
                value={supportSubject}
                onChange={(event) => setSupportSubject(event.target.value)}
                className="conv-input"
                placeholder="Example: Group03 commit mismatch"
              />
            </label>

            <label className="conv-field">
              <span className="conv-label">Message</span>
              <textarea
                value={supportMessage}
                onChange={(event) => setSupportMessage(event.target.value)}
                className="conv-textarea"
                rows={5}
                placeholder="Describe your issue/question for admin..."
              />
            </label>

            {supportError && (
              <p className="rounded-xl border border-[#f2d4d8] bg-[#fff5f7] px-3 py-2 text-sm text-[#af4d5e]">
                {supportError}
              </p>
            )}
            {supportSuccess && (
              <p className="rounded-xl border border-[#d6e9dd] bg-[#f1fbf5] px-3 py-2 text-sm text-[#2f7a50]">
                {supportSuccess}
              </p>
            )}

            <div className="conv-actions">
              <button
                type="submit"
                disabled={supportSending}
                className="conv-btn primary"
              >
                <SendHorizontal className="h-4 w-4" />
                {supportSending ? "Sending..." : "Send to Admin"}
              </button>
            </div>
          </form>

          <div className="conv-stack">
            <h3 className="conv-panel-title small">Recent Threads</h3>

            {supportThreads.length === 0 && (
              <p className="conv-empty subtle">
                No questions yet. Create your first question from this section.
              </p>
            )}

            {supportThreads.slice(0, 5).map((thread) => (
              <article key={thread.id} className="conv-modal-item">
                <div className="conv-row">
                  <h3>{thread.subject}</h3>
                  <span
                    className={`conv-badge ${
                      thread.status === "RESOLVED" ? "success" : "warning"
                    }`}
                  >
                    {thread.status}
                  </span>
                </div>
                <p>
                  Last update:{" "}
                  {new Date(thread.lastMessageAt || thread.updatedAt).toLocaleString(
                    "en-GB",
                    {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}
                </p>
                <p>
                  Unread admin replies:{" "}
                  <strong>{Number(thread.unreadCount || 0)}</strong>
                </p>
              </article>
            ))}
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
