import { useEffect, useMemo, useState } from "react";
import { GraduationCap, Search } from "lucide-react";
import axios from "../../api/axios";

function ConvenorStudents() {
  const [modules, setModules] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [contributorsByGroup, setContributorsByGroup] = useState({});
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const modulesRes = await axios.get("/modules");
        const moduleRows = modulesRes.data || [];
        setModules(moduleRows);
        if (moduleRows[0]) {
          setSelectedModuleId(String(moduleRows[0].id));
        }
      } catch (error) {
        console.error("Failed to load modules:", error);
      }
    };

    load();
  }, []);

  useEffect(() => {
    if (!selectedModuleId) return;

    const load = async () => {
      try {
        const groupRes = await axios.get(`/groups/module/${selectedModuleId}`);
        const rows = groupRes.data || [];
        setGroups(rows);

        const contributorPairs = await Promise.all(
          rows.map(async (group) => {
            try {
              const response = await axios.get(`/repositories/contributors/${group.id}`);
              return [group.id, response.data || []];
            } catch (error) {
              if (error.response?.status === 404) {
                return [group.id, []];
              }
              console.error("Failed to load contributors:", error);
              return [group.id, []];
            }
          })
        );

        setContributorsByGroup(Object.fromEntries(contributorPairs));
      } catch (error) {
        console.error("Failed to load groups:", error);
      }
    };

    load();
  }, [selectedModuleId]);

  const rows = useMemo(() => {
    const output = [];
    groups.forEach((group) => {
      (contributorsByGroup[group.id] || []).forEach((contributor) => {
        output.push({
          groupName: group.name,
          name: contributor.name,
          email: contributor.email,
          commits: Number(contributor.totalCommits || 0),
          contribution: contributor.contributionPercentage || "0.0",
          inactivity: contributor.inactivityFlag,
          lowQuality: Number(contributor.lowQualityCommits || 0),
        });
      });
    });

    const filtered = output.filter((row) => {
      const query = search.trim().toLowerCase();
      if (!query) return true;
      return (
        String(row.name || "").toLowerCase().includes(query) ||
        String(row.email || "").toLowerCase().includes(query) ||
        String(row.groupName || "").toLowerCase().includes(query)
      );
    });

    filtered.sort((a, b) => b.commits - a.commits);
    return filtered;
  }, [contributorsByGroup, groups, search]);

  return (
    <div className="conv-page">
      <section className="conv-card">
        <div className="conv-panel-header">
          <div>
            <p className="conv-kicker">Students</p>
            <h1 className="conv-panel-title">Student Contribution Directory</h1>
          </div>
          <span className="conv-chip">
            <GraduationCap className="h-3.5 w-3.5" /> Cohort View
          </span>
        </div>

        <div className="conv-two-col" style={{ gridTemplateColumns: "1fr 1fr" }}>
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
            <span className="conv-label">Search Student</span>
            <div className="flex items-center gap-2 rounded-xl border border-[#cfdeef] bg-white px-3">
              <Search className="h-4 w-4 text-[#6c84a4]" />
              <input
                className="w-full py-2 text-sm text-[#2c4260] outline-none"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name, email or group"
              />
            </div>
          </label>
        </div>

        <div className="conv-table-wrap">
          <table className="conv-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Group</th>
                <th>Commits</th>
                <th>Contribution</th>
                <th>Low Quality</th>
                <th>Inactivity</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7}>No student data found for selected filters.</td>
                </tr>
              )}
              {rows.map((row, index) => (
                <tr key={`${row.email}-${row.groupName}-${index}`}>
                  <td className="strong">{row.name}</td>
                  <td>{row.email}</td>
                  <td>{row.groupName}</td>
                  <td>{row.commits}</td>
                  <td>{row.contribution}%</td>
                  <td>{row.lowQuality}</td>
                  <td>
                    {row.inactivity ? (
                      <span className="conv-badge warning">Flagged</span>
                    ) : (
                      <span className="conv-badge success">Active</span>
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

export default ConvenorStudents;
