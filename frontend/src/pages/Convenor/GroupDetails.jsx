import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Download,
  FileDown,
  Link2,
  Link2Off,
  RefreshCcw,
  TrendingUp,
} from "lucide-react";
import { useParams } from "react-router-dom";
import axios from "../../api/axios";

const initialRepoForm = { url: "", platform: "GITLAB" };

function GroupDetails() {
  const { id } = useParams();

  const [repository, setRepository] = useState(null);
  const [summary, setSummary] = useState(null);
  const [contributors, setContributors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [repoForm, setRepoForm] = useState(initialRepoForm);

  useEffect(() => {
    loadPage();
  }, [id]);

  const loadPage = async () => {
    setLoading(true);
    try {
      await fetchRepositoryAndSummary();
    } finally {
      setLoading(false);
    }
  };

  const fetchRepositoryAndSummary = async (forceSync = false) => {
    try {
      const repoResponse = await axios.get(`/repositories/${id}`);
      const repo = repoResponse.data;
      setRepository(repo);

      if (repo) {
        if (forceSync) {
          await axios.get(`/repositories/contributors/${id}?refresh=true`);
        }
        const summaryResponse = await axios.get(`/reports/group/${id}`);
        setSummary(summaryResponse.data);

        const contributorsResponse = await axios.get(
          `/repositories/contributors/${id}`
        );
        setContributors(contributorsResponse.data || []);
      } else {
        setSummary(null);
        setContributors([]);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setRepository(null);
        setSummary(null);
        setContributors([]);
        return;
      }
      console.error("Failed to fetch repository/summary:", error);
      setSummary(null);
      setContributors([]);
    }
  };

  const downloadReport = async (type) => {
    try {
      const response = await axios.get(`/reports/group/${id}/${type}`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = `group-${id}-report.${type}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error(`Failed downloading ${type}:`, error);
    }
  };

  const handleRepositorySubmit = async (event) => {
    event.preventDefault();
    if (!repoForm.url.trim()) return;

    try {
      await axios.post("/repositories", {
        groupId: id,
        url: repoForm.url.trim(),
        platform: repoForm.platform,
      });

      setRepoForm(initialRepoForm);
      await loadPage();
    } catch (error) {
      console.error("Failed to link repository:", error);
      alert("Could not link repository. Please validate URL and platform.");
    }
  };

  const removeRepository = async () => {
    try {
      await axios.delete(`/repositories/${id}`);
      loadPage();
    } catch (error) {
      console.error("Failed to unlink repository:", error);
      alert("Unable to unlink repository. Please try again.");
    }
  };

  const totalCommits = useMemo(
    () =>
      summary?.students?.reduce(
        (sum, student) => sum + Number(student.totalCommits || 0),
        0
      ) || 0,
    [summary]
  );

  const inactivityCount = useMemo(
    () => summary?.students?.filter((student) => student.inactivityFlag).length || 0,
    [summary]
  );

  const spikeCount = useMemo(
    () => summary?.students?.filter((student) => student.deadlineSpike).length || 0,
    [summary]
  );

  const commitHistoryRows = useMemo(
    () =>
      (contributors || [])
        .flatMap((contributor) =>
          (contributor.commits || []).map((commit) => ({
            ...commit,
            studentName: contributor.name,
            studentEmail: contributor.email,
          }))
        )
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
    [contributors]
  );

  if (loading) {
    return <div className="conv-card conv-empty">Loading group report...</div>;
  }

  return (
    <div className="conv-page">
      <section className="conv-card">
        <div className="conv-panel-header">
          <div>
            <p className="conv-kicker">Group Report</p>
            <h1 className="conv-panel-title">Summary & Marking Evidence</h1>
          </div>

          {repository && (
            <button
              type="button"
              onClick={() => downloadReport("pdf")}
              className="conv-btn primary"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </button>
          )}
        </div>

        {!repository ? (
          <form onSubmit={handleRepositorySubmit}>
            <div className="conv-empty subtle">
              No repository is connected yet. Link one to compute consolidated
              contributions, quality flags, inactivity, and report exports.
            </div>

            <div className="conv-fields-2">
              <label className="conv-field">
                <span className="conv-label">Repository URL</span>
                <input
                  type="url"
                  required
                  value={repoForm.url}
                  onChange={(event) =>
                    setRepoForm((prev) => ({ ...prev, url: event.target.value }))
                  }
                  placeholder="https://gitlab.com/owner/repository"
                  className="conv-input"
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

            <div className="conv-panel-actions end">
              <button type="submit" className="conv-btn primary">
                <Link2 className="h-4 w-4" />
                Link Repository
              </button>
            </div>
          </form>
        ) : (
          <div className="conv-stack">
            <div className="conv-repo-banner">
              <div>
                <p className="conv-kicker">Repository</p>
                <p className="repo-platform">{repository.platform}</p>
                <a
                  href={repository.url}
                  target="_blank"
                  rel="noreferrer"
                  className="conv-link"
                >
                  Open repository URL
                </a>
              </div>

              <div className="conv-actions">
                <button
                  type="button"
                  onClick={() => downloadReport("csv")}
                  className="conv-btn light sm"
                >
                  <FileDown className="h-3.5 w-3.5" />
                  Export CSV
                </button>
                <button
                  type="button"
                  onClick={() => fetchRepositoryAndSummary(true)}
                  className="conv-btn muted sm"
                >
                  <RefreshCcw className="h-3.5 w-3.5" />
                  Refresh
                </button>
                <button
                  type="button"
                  onClick={removeRepository}
                  className="conv-btn danger sm"
                >
                  <Link2Off className="h-3.5 w-3.5" />
                  Unlink
                </button>
              </div>
            </div>

            {summary ? (
              <>
                <div className="conv-grid-3">
                  <article className="conv-stat-card">
                    <p className="conv-kicker">Total Commits</p>
                    <h2 className="conv-stat-value">{totalCommits}</h2>
                  </article>
                  <article className="conv-stat-card warning">
                    <p className="conv-kicker warning">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Inactivity Flags
                    </p>
                    <h2 className="conv-stat-value warning">{inactivityCount}</h2>
                  </article>
                  <article className="conv-stat-card purple">
                    <p className="conv-kicker purple">
                      <TrendingUp className="h-3.5 w-3.5" />
                      Deadline Spikes
                    </p>
                    <h2 className="conv-stat-value purple">{spikeCount}</h2>
                  </article>
                </div>

                <div className="conv-table-wrap">
                  <table className="conv-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Commits</th>
                        <th>Contribution</th>
                        <th>Low Quality</th>
                        <th>Inactivity</th>
                        <th>Spike</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(summary.students || []).map((student) => (
                        <tr key={student.email}>
                          <td className="strong">{student.name}</td>
                          <td>{student.email}</td>
                          <td>{student.totalCommits}</td>
                          <td>{student.contributionPercentage}%</td>
                          <td>{student.lowQualityCommits}</td>
                          <td>
                            {student.inactivityFlag ? (
                              <span className="conv-badge warning">Yes</span>
                            ) : (
                              <span className="conv-badge success">No</span>
                            )}
                          </td>
                          <td>
                            {student.deadlineSpike ? (
                              <span className="conv-badge purple">Spike</span>
                            ) : (
                              <span className="conv-badge success">None</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="conv-table-wrap">
                  <div className="conv-panel-header compact">
                    <div>
                      <p className="conv-kicker">Commit History</p>
                      <h2 className="conv-panel-title small">
                        Consolidated Commits Across All Branches
                      </h2>
                    </div>
                  </div>

                  {commitHistoryRows.length === 0 ? (
                    <div className="conv-empty subtle">
                      No commit history found yet. Refresh after repository sync.
                    </div>
                  ) : (
                    <table className="conv-table">
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>Email</th>
                          <th>SHA</th>
                          <th>Branch</th>
                          <th>Message</th>
                          <th>Date</th>
                          <th>Quality</th>
                        </tr>
                      </thead>
                      <tbody>
                        {commitHistoryRows.map((commit) => (
                          <tr
                            key={`${commit.studentEmail}-${commit.sha}-${commit.timestamp}`}
                          >
                            <td className="strong">{commit.studentName}</td>
                            <td>{commit.studentEmail}</td>
                            <td>{String(commit.sha || "").slice(0, 8)}</td>
                            <td>{commit.branch || "-"}</td>
                            <td>{commit.message || "-"}</td>
                            <td>
                              {commit.timestamp
                                ? new Date(commit.timestamp).toLocaleString("en-GB")
                                : "-"}
                            </td>
                            <td>
                              {commit.isLowQuality ? (
                                <span className="conv-badge warning">
                                  {commit.qualityScore ?? 0}
                                </span>
                              ) : (
                                <span className="conv-badge success">
                                  {commit.qualityScore ?? 0}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            ) : (
              <div className="conv-empty subtle">
                Summary data is not available yet. Refresh after repository sync.
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

export default GroupDetails;
