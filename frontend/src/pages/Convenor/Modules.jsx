import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Pencil, Trash2 } from "lucide-react";
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

function Modules() {
  const navigate = useNavigate();

  const [modules, setModules] = useState([]);
  const [groups, setGroups] = useState([]);

  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      const response = await axios.get("/modules");
      setModules(response.data || []);
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
