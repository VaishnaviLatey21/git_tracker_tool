import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Download,
  Eye,
  FileDown,
  Link2,
  Link2Off,
  RefreshCcw,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { useParams } from "react-router-dom";
import axios from "../../api/axios";

const initialRepoForm = { url: "", platform: "GITLAB" };

const getReviewStorageKey = (groupId) => `group-review-workflow:${groupId}`;

const getInitialReviewRow = () => ({
  status: "UNREVIEWED",
  notes: "",
});

const isFlaggedStudent = (student) =>
  Boolean(
    student?.belowExpectedCommits ||
      student?.inactivityFlag ||
      student?.deadlineSpike ||
      Number(student?.lowQualityCommits || 0) > 0
  );

function GroupDetails() {
  const { id } = useParams();

  const [repository, setRepository] = useState(null);
  const [summary, setSummary] = useState(null);
  const [contributors, setContributors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [repoForm, setRepoForm] = useState(initialRepoForm);
  const [reportPreviewOpen, setReportPreviewOpen] = useState(false);
  const [showFlaggedOnlyPreview, setShowFlaggedOnlyPreview] = useState(false);
  const [previewSortBy, setPreviewSortBy] = useState("commits");
  const [reviewRows, setReviewRows] = useState({});

  useEffect(() => {
    loadPage();
  }, [id]);

  useEffect(() => {
    if (!id) return;

    try {
      const raw = localStorage.getItem(getReviewStorageKey(id));
      setReviewRows(raw ? JSON.parse(raw) : {});
    } catch {
      setReviewRows({});
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    localStorage.setItem(getReviewStorageKey(id), JSON.stringify(reviewRows));
  }, [id, reviewRows]);

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

  const belowExpectedCount = useMemo(
    () =>
      summary?.students?.filter((student) => student.belowExpectedCommits).length ||
      0,
    [summary]
  );

  const validationStats = useMemo(() => {
    const rawCommits = (contributors || []).reduce(
      (sum, contributor) => sum + Number(contributor.totalCommits || 0),
      0
    );
    const computedCommits = (summary?.students || []).reduce(
      (sum, student) => sum + Number(student.totalCommits || 0),
      0
    );

    const rawContributorEmails = new Set(
      (contributors || []).map((contributor) => String(contributor.email || "").toLowerCase())
    );
    const computedEmails = new Set(
      (summary?.students || []).map((student) => String(student.email || "").toLowerCase())
    );

    const unmatchedRaw = Array.from(rawContributorEmails).filter(
      (email) => email && !computedEmails.has(email)
    ).length;

    return {
      rawCommits,
      computedCommits,
      commitDelta: computedCommits - rawCommits,
      rawContributors: rawContributorEmails.size,
      computedStudents: computedEmails.size,
      unmatchedRaw,
      isBalanced: rawCommits === computedCommits,
    };
  }, [contributors, summary]);

  const reviewCounts = useMemo(() => {
    const rows = summary?.students || [];
    return rows.reduce(
      (acc, student) => {
        const entry = reviewRows[student.email] || getInitialReviewRow();
        if (entry.status === "REVIEWED") acc.reviewed += 1;
        if (entry.status === "NEEDS_ACTION") acc.needsAction += 1;
        if (entry.status === "UNREVIEWED") acc.unreviewed += 1;
        return acc;
      },
      { reviewed: 0, needsAction: 0, unreviewed: 0 }
    );
  }, [summary, reviewRows]);

  const previewRows = useMemo(() => {
    let rows = [...(summary?.students || [])];

    if (showFlaggedOnlyPreview) {
      rows = rows.filter((student) => isFlaggedStudent(student));
    }

    rows.sort((a, b) => {
      if (previewSortBy === "name") {
        return String(a.name || "").localeCompare(String(b.name || ""));
      }
      if (previewSortBy === "risk") {
        const scoreA =
          (a.belowExpectedCommits ? 3 : 0) +
          (a.inactivityFlag ? 2 : 0) +
          (a.deadlineSpike ? 1 : 0) +
          Number(a.lowQualityCommits || 0);
        const scoreB =
          (b.belowExpectedCommits ? 3 : 0) +
          (b.inactivityFlag ? 2 : 0) +
          (b.deadlineSpike ? 1 : 0) +
          Number(b.lowQualityCommits || 0);
        return scoreB - scoreA;
      }

      return Number(b.totalCommits || 0) - Number(a.totalCommits || 0);
    });

    return rows;
  }, [summary, showFlaggedOnlyPreview, previewSortBy]);

  const updateReviewRow = (studentEmail, updates) => {
    setReviewRows((prev) => ({
      ...prev,
      [studentEmail]: {
        ...(prev[studentEmail] || getInitialReviewRow()),
        ...updates,
      },
    }));
  };

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
              <div className="conv-actions">
                <button
                  type="button"
                  onClick={() => setReportPreviewOpen(true)}
                  className="conv-btn light sm"
                >
                  <Eye className="h-4 w-4" />
                  Preview Report
                </button>
                <button
                  type="button"
                  onClick={() => downloadReport("pdf")}
                  className="conv-btn primary"
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </button>
              </div>
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
                <div className="conv-grid-4">
                  <article className="conv-stat-card">
                    <p className="conv-kicker">Total Commits</p>
                    <h2 className="conv-stat-value">{totalCommits}</h2>
                  </article>
                  <article className="conv-stat-card warning">
                    <p className="conv-kicker warning">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Below Expected
                    </p>
                    <h2 className="conv-stat-value warning">{belowExpectedCount}</h2>
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

                <div className="conv-validation-grid">
                  <article className="conv-card">
                    <div className="conv-panel-header compact">
                      <div>
                        <p className="conv-kicker">Validation Screen</p>
                        <h3 className="conv-panel-title small">
                          Raw vs Computed Evidence Check
                        </h3>
                      </div>
                      <span
                        className={`conv-badge ${
                          validationStats.isBalanced ? "success" : "warning"
                        }`}
                      >
                        {validationStats.isBalanced ? "Balanced" : "Needs review"}
                      </span>
                    </div>
                    <div className="conv-grid-4">
                      <article className="conv-stat-card compact">
                        <p className="conv-kicker">Raw Git Commits</p>
                        <h3 className="conv-stat-value mini">{validationStats.rawCommits}</h3>
                      </article>
                      <article className="conv-stat-card compact">
                        <p className="conv-kicker">Computed Commits</p>
                        <h3 className="conv-stat-value mini">
                          {validationStats.computedCommits}
                        </h3>
                      </article>
                      <article className="conv-stat-card compact">
                        <p className="conv-kicker">Commit Delta</p>
                        <h3 className="conv-stat-value mini">{validationStats.commitDelta}</h3>
                      </article>
                      <article className="conv-stat-card compact">
                        <p className="conv-kicker">Unmatched Authors</p>
                        <h3 className="conv-stat-value mini">{validationStats.unmatchedRaw}</h3>
                      </article>
                    </div>
                  </article>

                  <article className="conv-card">
                    <div className="conv-panel-header compact">
                      <div>
                        <p className="conv-kicker">Review Workflow</p>
                        <h3 className="conv-panel-title small">
                          Marking Progress by Student
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const next = {};
                          (summary.students || []).forEach((student) => {
                            next[student.email] = {
                              ...(reviewRows[student.email] || getInitialReviewRow()),
                              status: "REVIEWED",
                            };
                          });
                          setReviewRows(next);
                        }}
                        className="conv-btn muted sm"
                      >
                        <ClipboardCheck className="h-3.5 w-3.5" />
                        Mark All Reviewed
                      </button>
                    </div>
                    <div className="conv-actions">
                      <span className="conv-badge success">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Reviewed: {reviewCounts.reviewed}
                      </span>
                      <span className="conv-badge warning">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Needs Action: {reviewCounts.needsAction}
                      </span>
                      <span className="conv-badge">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Unreviewed: {reviewCounts.unreviewed}
                      </span>
                    </div>
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
                        <th>Below Expected</th>
                        <th>Inactivity</th>
                        <th>Spike</th>
                        <th>Review Status</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(summary.students || []).map((student, index) => (
                        <tr key={`${student.email}-${student.universityId || index}`}>
                          <td className="strong">{student.name}</td>
                          <td>{student.email}</td>
                          <td>{student.totalCommits}</td>
                          <td>{student.contributionPercentage}%</td>
                          <td>{student.lowQualityCommits}</td>
                          <td>
                            {student.belowExpectedCommits ? (
                              <span className="conv-badge warning">
                                Yes (&lt; {student.expectedCommitsTarget})
                              </span>
                            ) : (
                              <span className="conv-badge success">No</span>
                            )}
                          </td>
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
                          <td>
                            <select
                              value={
                                (reviewRows[student.email] || getInitialReviewRow()).status
                              }
                              onChange={(event) =>
                                updateReviewRow(student.email, {
                                  status: event.target.value,
                                })
                              }
                              className="conv-select conv-table-control"
                            >
                              <option value="UNREVIEWED">Unreviewed</option>
                              <option value="REVIEWED">Reviewed</option>
                              <option value="NEEDS_ACTION">Needs Action</option>
                            </select>
                          </td>
                          <td>
                            <input
                              type="text"
                              value={
                                (reviewRows[student.email] || getInitialReviewRow())
                                  .notes
                              }
                              onChange={(event) =>
                                updateReviewRow(student.email, {
                                  notes: event.target.value,
                                })
                              }
                              placeholder="Add marking notes..."
                              className="conv-input conv-table-control"
                            />
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

      {reportPreviewOpen && summary && (
        <div className="conv-modal-backdrop">
          <div className="conv-modal conv-modal-lg">
            <div className="conv-modal-header">
              <div>
                <h3 className="conv-modal-title">Report Preview</h3>
                <p className="conv-modal-subtitle">
                  Branded evidence summary before exporting PDF
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReportPreviewOpen(false)}
                className="conv-btn muted sm"
              >
                Close
              </button>
            </div>

            <div className="conv-modal-body">
              <div className="conv-row">
                <div>
                  <p className="conv-kicker">Git Tracker Tool</p>
                  <h3 className="conv-panel-title small">
                    {summary.moduleName} - {summary.groupName}
                  </h3>
                </div>
                <div className="conv-actions">
                  <label className="conv-chip">
                    <input
                      type="checkbox"
                      checked={showFlaggedOnlyPreview}
                      onChange={(event) =>
                        setShowFlaggedOnlyPreview(event.target.checked)
                      }
                    />
                    Flagged only
                  </label>
                  <select
                    value={previewSortBy}
                    onChange={(event) => setPreviewSortBy(event.target.value)}
                    className="conv-select"
                  >
                    <option value="commits">Sort by commits</option>
                    <option value="risk">Sort by risk</option>
                    <option value="name">Sort by name</option>
                  </select>
                </div>
              </div>

              <div className="conv-notes">
                Thresholds: minimum commits {summary.thresholds?.minExpectedCommits},
                inactivity {summary.thresholds?.inactivityDays} days, small commit
                threshold &lt; {summary.thresholds?.smallCommitThreshold} lines.
              </div>

              <div className="conv-table-wrap">
                <table className="conv-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Commits</th>
                      <th>Contribution</th>
                      <th>Low Quality</th>
                      <th>Below Expected</th>
                      <th>Inactivity</th>
                      <th>Spike</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((student, index) => (
                      <tr key={`preview-${student.email}-${student.universityId || index}`}>
                        <td className="strong">{student.name}</td>
                        <td>{student.totalCommits}</td>
                        <td>{student.contributionPercentage}%</td>
                        <td>{student.lowQualityCommits}</td>
                        <td>{student.belowExpectedCommits ? "Yes" : "No"}</td>
                        <td>{student.inactivityFlag ? "Yes" : "No"}</td>
                        <td>{student.deadlineSpike ? "Yes" : "No"}</td>
                      </tr>
                    ))}
                    {previewRows.length === 0 && (
                      <tr>
                        <td colSpan={7}>No students match current preview filters.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="conv-modal-footer">
              <button
                type="button"
                onClick={() => setReportPreviewOpen(false)}
                className="conv-btn muted"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => downloadReport("pdf")}
                className="conv-btn primary"
              >
                <Download className="h-4 w-4" />
                Export PDF Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GroupDetails;
