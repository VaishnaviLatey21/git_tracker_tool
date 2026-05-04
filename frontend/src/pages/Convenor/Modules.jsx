import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Bot,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  Pencil,
  Plus,
  Rocket,
  Trash2,
  Upload,
} from "lucide-react";
import axios from "../../api/axios";

const yearOptions = [
  "2023 - 2024",
  "2024 - 2025",
  "2025 - 2026",
  "2026 - 2027",
  "2027 - 2028",
];

const initialForm = {
  name: "",
  year: "2025 - 2026",
  minExpectedCommits: 0,
  inactivityDays: 0,
  smallCommitThreshold: 0,
};

const initialProvisionForm = {
  moduleId: "",
  groupSize: 4,
  groupPrefix: "Group",
  projectPrefix: "",
  namespacePath: "",
  visibility: "private",
  accessLevel: "DEVELOPER",
  initializeWithReadme: true,
  allowExistingGroups: true,
};

const createProvisionStudentRow = () => ({
  name: "",
  universityId: "",
  gitUsername: "",
  gitEmail: "",
});

const formatAssignmentSummary = (summary = {}) => {
  const entries = Object.entries(summary || {}).filter(
    ([, value]) => Number(value) > 0
  );
  if (entries.length === 0) return "No assignments";
  return entries.map(([key, value]) => `${key}: ${value}`).join(" | ");
};

function Modules() {
  const navigate = useNavigate();

  const [modules, setModules] = useState([]);
  const [groups, setGroups] = useState([]);

  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [form, setForm] = useState(initialForm);

  const [provisionForm, setProvisionForm] = useState(initialProvisionForm);
  const [provisionStudents, setProvisionStudents] = useState([
    createProvisionStudentRow(),
    createProvisionStudentRow(),
    createProvisionStudentRow(),
    createProvisionStudentRow(),
  ]);
  const [bulkStudentsInput, setBulkStudentsInput] = useState("");
  const [provisionLoading, setProvisionLoading] = useState(false);
  const [provisionError, setProvisionError] = useState("");
  const [provisionResult, setProvisionResult] = useState(null);
  const [isProvisionOpen, setIsProvisionOpen] = useState(false);

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      const response = await axios.get("/modules");
      const moduleRows = response.data || [];
      setModules(moduleRows);

      if (!selectedModuleId && moduleRows[0]) {
        setSelectedModuleId(String(moduleRows[0].id));
      }

      setProvisionForm((prev) => {
        if (prev.moduleId) return prev;
        const firstModule = moduleRows[0];
        if (!firstModule) return prev;
        return {
          ...prev,
          moduleId: String(firstModule.id),
          projectPrefix: firstModule.name || "",
        };
      });
    } catch (error) {
      console.error("Failed to fetch modules:", error);
    }
  };

  const fetchGroupsForModule = async (moduleId) => {
    try {
      const response = await axios.get(`/groups/module/${moduleId}`);
      setGroups(response.data || []);
    } catch (error) {
      console.error("Failed to fetch groups:", error);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (
      form.minExpectedCommits < 0 ||
      form.inactivityDays < 0 ||
      form.smallCommitThreshold < 0
    ) {
      alert("Threshold values cannot be negative.");
      return;
    }

    try {
      if (editingId) {
        await axios.put(`/modules/${editingId}`, form);
        setEditingId(null);
      } else {
        await axios.post("/modules", form);
        alert("New module created successfully....");
      }

      setForm(initialForm);
      fetchModules();
    } catch (error) {
      console.error("Failed to save module:", error);
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert("Unable to save module right now.");
      }
    }
  };

  const handleEdit = (module) => {
    setForm({
      name: module.name,
      year: module.year,
      minExpectedCommits: module.minExpectedCommits,
      inactivityDays: module.inactivityDays,
      smallCommitThreshold: module.smallCommitThreshold,
    });
    setEditingId(module.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (moduleId) => {
    try {
      await axios.delete(`/modules/${moduleId}`);
      if (selectedModuleId === String(moduleId)) {
        setSelectedModuleId("");
        setSelectedGroupId("");
        setGroups([]);
      }
      fetchModules();
    } catch (error) {
      console.error("Failed to delete module:", error);
      alert("Unable to delete module. Please try again.");
    }
  };

  const filteredModules = useMemo(
    () =>
      modules.filter((module) =>
        module.name.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [modules, searchTerm]
  );

  const updateProvisionStudentRow = (index, field, value) => {
    setProvisionStudents((prev) =>
      prev.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: value } : row
      )
    );
  };

  const addProvisionStudentRow = () => {
    setProvisionStudents((prev) => [...prev, createProvisionStudentRow()]);
  };

  const removeProvisionStudentRow = (index) => {
    setProvisionStudents((prev) => {
      if (prev.length <= 1) return [createProvisionStudentRow()];
      return prev.filter((_, rowIndex) => rowIndex !== index);
    });
  };

  const importBulkStudents = () => {
    const rows = String(bulkStudentsInput || "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [name, universityId, gitUsername = "", gitEmail = ""] = line
          .split(",")
          .map((item) => item.trim());
        return { name, universityId, gitUsername, gitEmail };
      })
      .filter((row) => row.name && row.universityId);

    if (!rows.length) {
      alert(
        "Paste valid CSV lines in this format: name,universityId,gitUsername,gitEmail"
      );
      return;
    }

    setProvisionStudents(rows);
    setBulkStudentsInput("");
  };

  const runProvision = async (dryRun) => {
    const moduleId = Number.parseInt(provisionForm.moduleId, 10);
    if (!moduleId) {
      alert("Please select a module first.");
      return;
    }

    const students = provisionStudents
      .map((row) => ({
        name: String(row.name || "").trim(),
        universityId: String(row.universityId || "").trim(),
        gitUsername: String(row.gitUsername || "").trim(),
        gitEmail: String(row.gitEmail || "").trim(),
      }))
      .filter((row) => row.name && row.universityId);

    if (!students.length) {
      alert("Please add at least one valid student row.");
      return;
    }

    setProvisionLoading(true);
    setProvisionError("");
    setProvisionResult(null);

    try {
      const payload = {
        students,
        groupSize: Math.max(2, Number.parseInt(provisionForm.groupSize, 10) || 4),
        groupPrefix: String(provisionForm.groupPrefix || "Group").trim() || "Group",
        projectPrefix: String(provisionForm.projectPrefix || "").trim(),
        namespacePath:
          String(provisionForm.namespacePath || "").trim() || null,
        visibility: provisionForm.visibility,
        accessLevel: provisionForm.accessLevel,
        initializeWithReadme: !!provisionForm.initializeWithReadme,
        allowExistingGroups: !!provisionForm.allowExistingGroups,
        dryRun: !!dryRun,
      };

      const response = await axios.post(
        `/modules/${moduleId}/auto-provision-gitlab`,
        payload
      );

      setProvisionResult(response.data);
      if (!dryRun) {
        await fetchModules();
        await fetchGroupsForModule(moduleId);
      }
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Provisioning failed. Please check inputs and try again.";
      setProvisionError(message);
    } finally {
      setProvisionLoading(false);
    }
  };

  return (
    <div className="conv-page">
      <section className="conv-two-col">
        <article className="conv-card">
          <div className="conv-panel-header">
            <div>
              <p className="conv-kicker">Module Setup</p>
              <h1 className="conv-panel-title">
                {editingId ? "Update Module Settings" : "Create New Module"}
              </h1>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <label className="conv-field">
              <span className="conv-label">Module Name</span>
              <input
                value={form.name}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, name: event.target.value }))
                }
                required
                placeholder="Software Engineering Project"
                className="conv-input"
              />
            </label>

            <div className="conv-fields-2">
              <label className="conv-field">
                <span className="conv-label">Academic Year</span>
                <select
                  value={form.year}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, year: event.target.value }))
                  }
                  className="conv-select"
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </label>

              <label className="conv-field">
                <span className="conv-label">Min Commits per Student</span>
                <input
                  type="number"
                  min={0}
                  value={form.minExpectedCommits}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      minExpectedCommits: Number(event.target.value),
                    }))
                  }
                  className="conv-input"
                />
              </label>

              <label className="conv-field">
                <span className="conv-label">Inactivity Days</span>
                <input
                  type="number"
                  min={0}
                  value={form.inactivityDays}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      inactivityDays: Number(event.target.value),
                    }))
                  }
                  className="conv-input"
                />
              </label>

              <label className="conv-field">
                <span className="conv-label">Small Commit Threshold (lines)</span>
                <input
                  type="number"
                  min={0}
                  value={form.smallCommitThreshold}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      smallCommitThreshold: Number(event.target.value),
                    }))
                  }
                  className="conv-input"
                />
              </label>
            </div>

            <div className="conv-panel-actions end">
              <button type="submit" className="conv-btn primary">
                {editingId ? "Update Module" : "Create Module"}
              </button>
            </div>
          </form>
        </article>

        <article className="conv-card">
          <div className="conv-panel-header">
            <div>
              <p className="conv-kicker">Quick Navigation</p>
              <h2 className="conv-panel-title">Jump to Group Analytics</h2>
            </div>
          </div>

          <div className="conv-field">
            <span className="conv-label">Select Module</span>
            <select
              value={selectedModuleId}
              onChange={(event) => {
                const moduleId = event.target.value;
                setSelectedModuleId(moduleId);
                setSelectedGroupId("");
                if (moduleId) fetchGroupsForModule(moduleId);
              }}
              className="conv-select"
            >
              <option value="">Choose module</option>
              {modules.map((module) => (
                <option key={module.id} value={module.id}>
                  {module.name} ({module.year})
                </option>
              ))}
            </select>
          </div>

          <div className="conv-field">
            <span className="conv-label">Select Group</span>
            <select
              value={selectedGroupId}
              disabled={!selectedModuleId}
              onChange={(event) => {
                const groupId = event.target.value;
                setSelectedGroupId(groupId);
                if (groupId) navigate(`/convenor/groups/${groupId}`);
              }}
              className="conv-select"
            >
              <option value="">Choose group</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>

          <div className="conv-notes">
            <p>
              Configure thresholds first, then drill into groups for detailed
              contribution and risk analysis.
            </p>
          </div>
        </article>
      </section>

      <section className="conv-card">
        <div className="conv-panel-header">
          <div>
            <p className="conv-kicker">Automation</p>
            <h2 className="conv-panel-title">Auto Group + GitLab Provisioning</h2>
            <p className="conv-panel-subtitle">
              Split students into teams, create GitLab projects, and assign
              members with predefined access.
            </p>
          </div>
          <div className="conv-actions">
            <button
              type="button"
              onClick={() => setIsProvisionOpen((prev) => !prev)}
              className="conv-btn muted sm"
            >
              {isProvisionOpen ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
              {isProvisionOpen ? "Hide Section" : "Open Section"}
            </button>
          </div>
        </div>

        {isProvisionOpen && (
          <>
            <div className="conv-panel-actions">
              <button
                type="button"
                onClick={() => runProvision(true)}
                className="conv-btn light sm"
                disabled={provisionLoading}
              >
                <FlaskConical className="h-3.5 w-3.5" />
                Dry Run
              </button>
              <button
                type="button"
                onClick={() => runProvision(false)}
                className="conv-btn primary sm"
                disabled={provisionLoading}
              >
                <Rocket className="h-3.5 w-3.5" />
                {provisionLoading ? "Processing..." : "Create Groups + Projects"}
              </button>
            </div>

            <div className="conv-fields-2">
          <label className="conv-field">
            <span className="conv-label">Module</span>
            <select
              value={provisionForm.moduleId}
              onChange={(event) =>
                setProvisionForm((prev) => ({
                  ...prev,
                  moduleId: event.target.value,
                }))
              }
              className="conv-select"
            >
              <option value="">Choose module</option>
              {modules.map((module) => (
                <option key={module.id} value={module.id}>
                  {module.name} ({module.year})
                </option>
              ))}
            </select>
          </label>

          <label className="conv-field">
            <span className="conv-label">Group Size</span>
            <input
              type="number"
              min={2}
              value={provisionForm.groupSize}
              onChange={(event) =>
                setProvisionForm((prev) => ({
                  ...prev,
                  groupSize: Number(event.target.value),
                }))
              }
              className="conv-input"
            />
          </label>

          <label className="conv-field">
            <span className="conv-label">Group Prefix</span>
            <input
              value={provisionForm.groupPrefix}
              onChange={(event) =>
                setProvisionForm((prev) => ({
                  ...prev,
                  groupPrefix: event.target.value,
                }))
              }
              className="conv-input"
              placeholder="Group"
            />
          </label>

          <label className="conv-field">
            <span className="conv-label">Project Prefix</span>
            <input
              value={provisionForm.projectPrefix}
              onChange={(event) =>
                setProvisionForm((prev) => ({
                  ...prev,
                  projectPrefix: event.target.value,
                }))
              }
              className="conv-input"
              placeholder="BDA-2025"
            />
          </label>

          <label className="conv-field">
            <span className="conv-label">GitLab Namespace (optional)</span>
            <input
              value={provisionForm.namespacePath}
              onChange={(event) =>
                setProvisionForm((prev) => ({
                  ...prev,
                  namespacePath: event.target.value,
                }))
              }
              className="conv-input"
              placeholder="group/subgroup"
            />
          </label>

          <label className="conv-field">
            <span className="conv-label">Visibility</span>
            <select
              value={provisionForm.visibility}
              onChange={(event) =>
                setProvisionForm((prev) => ({
                  ...prev,
                  visibility: event.target.value,
                }))
              }
              className="conv-select"
            >
              <option value="private">Private</option>
              <option value="internal">Internal</option>
              <option value="public">Public</option>
            </select>
          </label>

          <label className="conv-field">
            <span className="conv-label">Access Level</span>
            <select
              value={provisionForm.accessLevel}
              onChange={(event) =>
                setProvisionForm((prev) => ({
                  ...prev,
                  accessLevel: event.target.value,
                }))
              }
              className="conv-select"
            >
              <option value="GUEST">Guest</option>
              <option value="REPORTER">Reporter</option>
              <option value="DEVELOPER">Developer</option>
              <option value="MAINTAINER">Maintainer</option>
            </select>
          </label>

          <label className="conv-field">
            <span className="conv-label">Initialize README</span>
            <select
              value={provisionForm.initializeWithReadme ? "yes" : "no"}
              onChange={(event) =>
                setProvisionForm((prev) => ({
                  ...prev,
                  initializeWithReadme: event.target.value === "yes",
                }))
              }
              className="conv-select"
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </label>

          <label className="conv-field">
            <span className="conv-label">Allow Existing Groups</span>
            <select
              value={provisionForm.allowExistingGroups ? "yes" : "no"}
              onChange={(event) =>
                setProvisionForm((prev) => ({
                  ...prev,
                  allowExistingGroups: event.target.value === "yes",
                }))
              }
              className="conv-select"
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </label>
            </div>

            <div className="conv-field">
          <span className="conv-label">
            Paste Students (CSV lines: name,universityId,gitUsername,gitEmail)
          </span>
          <textarea
            value={bulkStudentsInput}
            onChange={(event) => setBulkStudentsInput(event.target.value)}
            className="conv-textarea"
            rows={4}
            placeholder="Vaishnavi,u001,vaishnavi_git,vaishnavi@uni.ac.uk"
          />
          <div className="conv-panel-actions">
            <button
              type="button"
              onClick={importBulkStudents}
              className="conv-btn muted sm"
            >
              <Upload className="h-3.5 w-3.5" />
              Import Rows
            </button>
          </div>
            </div>

            <div className="conv-mapping-wrap">
          <div className="conv-panel-header compact">
            <div>
              <h3 className="conv-panel-title small">Student List</h3>
              <p className="conv-panel-subtitle">
                Provide name + university ID, and preferably GitLab username.
              </p>
            </div>
            <button
              type="button"
              onClick={addProvisionStudentRow}
              className="conv-btn muted sm"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Row
            </button>
          </div>

          <div className="conv-mapping-list">
            {provisionStudents.map((student, index) => (
              <div key={`provision-student-${index}`} className="conv-mapping-row">
                <input
                  value={student.name}
                  onChange={(event) =>
                    updateProvisionStudentRow(index, "name", event.target.value)
                  }
                  placeholder="Student Name"
                  className="conv-input"
                />
                <input
                  value={student.universityId}
                  onChange={(event) =>
                    updateProvisionStudentRow(
                      index,
                      "universityId",
                      event.target.value
                    )
                  }
                  placeholder="University ID"
                  className="conv-input"
                />
                <input
                  value={student.gitUsername}
                  onChange={(event) =>
                    updateProvisionStudentRow(
                      index,
                      "gitUsername",
                      event.target.value
                    )
                  }
                  placeholder="GitLab Username"
                  className="conv-input"
                />
                <input
                  value={student.gitEmail}
                  onChange={(event) =>
                    updateProvisionStudentRow(index, "gitEmail", event.target.value)
                  }
                  placeholder="Git Email"
                  className="conv-input"
                />
                <button
                  type="button"
                  onClick={() => removeProvisionStudentRow(index)}
                  className="conv-btn danger sm"
                  title="Remove row"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
            </div>

            {provisionError && (
              <p className="conv-empty subtle" style={{ color: "#b64b5a" }}>
                {provisionError}
              </p>
            )}

            {provisionResult && (
              <div className="conv-stack">
                <div className="conv-grid-3">
                  <article className="conv-stat-card">
                    <p className="conv-kicker">Total Groups</p>
                    <h3 className="conv-stat-value">
                      {provisionResult.summary?.totalGroups || 0}
                    </h3>
                  </article>
                  <article className="conv-stat-card">
                    <p className="conv-kicker">Created</p>
                    <h3 className="conv-stat-value">
                      {provisionResult.summary?.createdGroups || 0}
                    </h3>
                  </article>
                  <article className="conv-stat-card danger">
                    <p className="conv-kicker danger">Failed</p>
                    <h3 className="conv-stat-value danger">
                      {provisionResult.summary?.failedGroups || 0}
                    </h3>
                  </article>
                </div>

                <div className="conv-table-wrap">
                  <table className="conv-table">
                    <thead>
                      <tr>
                        <th>Group</th>
                        <th>Status</th>
                        <th>Project URL</th>
                        <th>Assignments</th>
                        <th>Error</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(provisionResult.results || []).map((row) => (
                        <tr key={`${row.groupName}-${row.projectName}`}>
                          <td className="strong">{row.groupName}</td>
                          <td>{row.status}</td>
                          <td>
                            {row.project?.url ? (
                              <a
                                className="conv-link"
                                href={row.project.url}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <Bot className="h-3.5 w-3.5" />
                                Open Project
                              </a>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td>{formatAssignmentSummary(row.assignmentSummary)}</td>
                          <td>{row.error || row.cleanup || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      <section className="conv-card">
        <div className="conv-panel-header">
          <div>
            <p className="conv-kicker">Module Inventory</p>
            <h2 className="conv-panel-title">Configured Modules</h2>
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search modules..."
            className="conv-input search"
          />
        </div>

        <div className="conv-table-wrap">
          <table className="conv-table">
            <thead>
              <tr>
                <th>Module</th>
                <th>Year</th>
                <th>Min Commits</th>
                <th>Inactivity</th>
                <th>Small Commit</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredModules.map((module) => (
                <tr key={module.id}>
                  <td className="strong">{module.name}</td>
                  <td>{module.year}</td>
                  <td>{module.minExpectedCommits}</td>
                  <td>{module.inactivityDays} days</td>
                  <td>&lt; {module.smallCommitThreshold} lines</td>
                  <td>
                    <div className="conv-actions">
                      <button
                        type="button"
                        onClick={() => navigate(`/convenor/modules/${module.id}`)}
                        className="conv-btn light sm"
                      >
                        Groups
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEdit(module)}
                        className="conv-btn warn sm"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(module.id)}
                        className="conv-btn danger sm"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredModules.length === 0 && (
            <p className="conv-empty subtle">No modules matched your search.</p>
          )}
        </div>
      </section>
    </div>
  );
}

export default Modules;
