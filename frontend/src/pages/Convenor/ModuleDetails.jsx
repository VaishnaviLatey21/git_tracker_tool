import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Link2, Pencil, Trash2 } from "lucide-react";
import axios from "../../api/axios";

const createStudentRow = () => ({
  name: "",
  universityId: "",
  gitEmail: "",
  gitUsername: "",
});

const rowsFromStudents = (students = []) => {
  const rows = [];

  students.forEach((student) => {
    if (!student.identities?.length) {
      rows.push({
        name: student.name || "",
        universityId: student.universityId || "",
        gitEmail: "",
        gitUsername: "",
      });
      return;
    }

    student.identities.forEach((identity) => {
      rows.push({
        name: student.name || "",
        universityId: student.universityId || "",
        gitEmail: identity.gitEmail || "",
        gitUsername: identity.gitUsername || "",
      });
    });
  });

  return rows.length ? rows : [createStudentRow()];
};

const buildStudentPayload = (rows = []) => {
  const grouped = new Map();

  rows.forEach((row) => {
    const name = (row.name || "").trim();
    const universityId = (row.universityId || "").trim();
    const gitEmail = (row.gitEmail || "").trim();
    const gitUsername = (row.gitUsername || "").trim();

    if (!name || !universityId) return;

    const key = `${name.toLowerCase()}::${universityId.toLowerCase()}`;
    if (!grouped.has(key)) {
      grouped.set(key, {
        name,
        universityId,
        identities: [],
      });
    }

    if (gitEmail || gitUsername) {
      grouped.get(key).identities.push({
        gitEmail,
        gitUsername,
      });
    }
  });

  return Array.from(grouped.values());
};

function ModuleDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [groups, setGroups] = useState([]);
  const [repositoriesByGroup, setRepositoriesByGroup] = useState({});

  const [groupName, setGroupName] = useState("");
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [repositoryPlatform, setRepositoryPlatform] = useState("GITLAB");
  const [studentRows, setStudentRows] = useState([createStudentRow()]);

  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchGroups();
  }, [id]);

  const fetchGroups = async () => {
    try {
      const response = await axios.get(`/groups/module/${id}`);
      const allGroups = response.data || [];
      setGroups(allGroups);
      allGroups.forEach((group) => fetchRepository(group.id));
    } catch (error) {
      console.error("Failed to fetch groups:", error);
    }
  };

  const fetchRepository = async (groupId) => {
    try {
      const response = await axios.get(`/repositories/${groupId}`);
      setRepositoriesByGroup((prev) => ({ ...prev, [groupId]: response.data }));
    } catch (error) {
      if (error.response?.status === 404) {
        setRepositoriesByGroup((prev) => ({ ...prev, [groupId]: null }));
        return;
      }
      console.error("Failed to fetch repository:", error);
    }
  };

  const resetForm = () => {
    setGroupName("");
    setRepositoryUrl("");
    setRepositoryPlatform("GITLAB");
    setStudentRows([createStudentRow()]);
    setEditingId(null);
  };

  const updateStudentRow = (index, field, value) => {
    setStudentRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const addStudentRow = () => {
    setStudentRows((prev) => [...prev, createStudentRow()]);
  };

  const removeStudentRow = (index) => {
    setStudentRows((prev) => {
      if (prev.length === 1) return [createStudentRow()];
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!groupName.trim()) {
      alert("Group name is required");
      return;
    }

    if (!repositoryUrl.trim()) {
      alert("Repository URL is required ");
      return;
    }

    try {
      let targetGroupId = editingId;

      if (editingId) {
        await axios.put(`/groups/${editingId}`, { name: groupName.trim() });
      } else {
        const createResponse = await axios.post("/groups", {
          name: groupName.trim(),
          moduleId: id,
          repositoryUrl: repositoryUrl.trim(),
          platform: repositoryPlatform,
        });
        targetGroupId = createResponse.data?.id;
      }

      // if (repositoryUrl.trim() && targetGroupId) {
      //   await axios.post("/repositories", {
      //     groupId: targetGroupId,
      //     url: repositoryUrl.trim(),
      //     platform: repositoryPlatform,
      //   });
      // }

      if (targetGroupId) {
        const students = buildStudentPayload(studentRows);
        await axios.put(`/groups/${targetGroupId}/students`, { students });
      }

      resetForm();
      fetchGroups();
      if (!editingId) {
        alert("New Group created successfully ");
      }
    } catch (error) {
      console.error("Failed to save group:", error);
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert("Unable to save this group right now.");
      }
    }
  };

  const handleEdit = async (group) => {
    try {
      const linkedRepo = repositoriesByGroup[group.id];
      setGroupName(group.name);
      setRepositoryUrl(linkedRepo?.url || "");
      setRepositoryPlatform(linkedRepo?.platform || "GITLAB");
      setEditingId(group.id);

      const studentsResponse = await axios.get(`/groups/${group.id}/students`);
      setStudentRows(rowsFromStudents(studentsResponse.data || []));

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error("Failed to load student mappings:", error);
      setStudentRows([createStudentRow()]);
    }
  };

  const handleDelete = async (groupId) => {
    try {
      await axios.delete(`/groups/${groupId}`);
      fetchGroups();
    } catch (error) {
      console.error("Failed to delete group:", error);
      alert("Unable to delete group. Please try again.");
    }
  };

  const filteredGroups = useMemo(
    () =>
      groups.filter((group) =>
        group.name.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [groups, searchTerm]
  );

  return (
    <div className="conv-page">
      <section className="conv-two-col">
        <article className="conv-card">
          <div className="conv-panel-header">
            <div>
              <p className="conv-kicker">Group Setup</p>
              <h1 className="conv-panel-title">
                {editingId ? "Update Group" : "Create New Group"}
              </h1>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <label className="conv-field">
              <span className="conv-label">Group Name</span>
              <input
                value={groupName}
                onChange={(event) => setGroupName(event.target.value)}
                required
                placeholder="PSCM Group 3"
                className="conv-input"
              />
            </label>

            <div className="conv-fields-2">
              <label className="conv-field">
                <span className="conv-label">Repository URL</span>
                <input
                  value={repositoryUrl}
                  onChange={(event) => setRepositoryUrl(event.target.value)}
                  placeholder="https://gitlab.com/owner/repository"
                  className="conv-input"
                />
              </label>

              <label className="conv-field">
                <span className="conv-label">Platform</span>
                <select
                  value={repositoryPlatform}
                  onChange={(event) => setRepositoryPlatform(event.target.value)}
                  className="conv-select"
                >
                  <option value="GITLAB">GitLab</option>
                  <option value="GITHUB">GitHub</option>
                </select>
              </label>
            </div>

            <div className="conv-mapping-wrap">
              <div className="conv-panel-header compact">
                <div>
                  <h2 className="conv-panel-title small">Student Identity Mapping</h2>
                  <p className="conv-panel-subtitle">
                    Map Git emails/usernames so analytics merge aliases correctly.
                  </p>
                </div>
                <button type="button" onClick={addStudentRow} className="conv-btn muted sm">
                  + Add Row
                </button>
              </div>

              <div className="conv-mapping-list">
                {studentRows.map((row, index) => (
                  <div key={`student-row-${index}`} className="conv-mapping-row">
                    <input
                      value={row.name}
                      onChange={(event) =>
                        updateStudentRow(index, "name", event.target.value)
                      }
                      placeholder="Student Name"
                      className="conv-input"
                    />
                    <input
                      value={row.universityId}
                      onChange={(event) =>
                        updateStudentRow(index, "universityId", event.target.value)
                      }
                      placeholder="Univ ID"
                      className="conv-input"
                    />
                    <input
                      value={row.gitEmail}
                      onChange={(event) =>
                        updateStudentRow(index, "gitEmail", event.target.value)
                      }
                      placeholder="Git Email"
                      className="conv-input"
                    />
                    <input
                      value={row.gitUsername}
                      onChange={(event) =>
                        updateStudentRow(index, "gitUsername", event.target.value)
                      }
                      placeholder="Git Username"
                      className="conv-input"
                    />
                    <button
                      type="button"
                      onClick={() => removeStudentRow(index)}
                      className="conv-btn danger sm"
                      title="Remove row"
                    >
                      X
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="conv-panel-actions end">
              <button type="submit" className="conv-btn primary">
                {editingId ? "Update Group" : "Create Group"}
              </button>
            </div>
          </form>
        </article>

        <article className="conv-card">
          <div className="conv-panel-header">
            <div>
              <p className="conv-kicker">Group Objectives</p>
              <h2 className="conv-panel-title">Analytics Coverage Checklist</h2>
            </div>
          </div>
          <ul className="conv-checklist">
            <li>Consolidate commits across all branches.</li>
            <li>Detect low-quality commits and inactivity patterns.</li>
            <li>Merge alias identities (email/username) to verified students.</li>
            <li>Export group summary for fair, evidence-based marking.</li>
          </ul>
        </article>
      </section>

      <section className="conv-card">
        <div className="conv-panel-header">
          <div>
            <p className="conv-kicker">Existing Groups</p>
            <h2 className="conv-panel-title">Module Group List</h2>
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search groups..."
            className="conv-input search"
          />
        </div>

        <div className="conv-group-grid">
          {filteredGroups.map((group) => {
            const repository = repositoriesByGroup[group.id];
            return (
              <article key={group.id} className="conv-group-card">
                <div className="conv-row">
                  <h3>{group.name}</h3>
                  {repository && <span className="conv-tag">{repository.platform}</span>}
                </div>

                {repository ? (
                  <a
                    href={repository.url}
                    target="_blank"
                    rel="noreferrer"
                    className="conv-link"
                  >
                    <Link2 className="h-3.5 w-3.5" />
                    Repository linked
                  </a>
                ) : (
                  <p className="conv-meta">Repository not linked yet</p>
                )}

                <div className="conv-actions">
                  <button
                    type="button"
                    onClick={() => navigate(`/convenor/groups/${group.id}`)}
                    className="conv-btn light sm"
                  >
                    View Report
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEdit(group)}
                    className="conv-btn warn sm"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(group.id)}
                    className="conv-btn danger sm"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        {filteredGroups.length === 0 && (
          <p className="conv-empty subtle">No groups found.</p>
        )}
      </section>
    </div>
  );
}

export default ModuleDetails;
