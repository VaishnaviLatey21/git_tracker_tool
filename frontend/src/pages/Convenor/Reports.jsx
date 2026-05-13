import { useEffect, useState } from "react";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import axios from "../../api/axios";

function ConvenorReports() {
  const [modules, setModules] = useState([]);
  const [groupsByModule, setGroupsByModule] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const moduleRes = await axios.get("/modules");
        const moduleRows = moduleRes.data || [];
        setModules(moduleRows);

        const groupPairs = await Promise.all(
          moduleRows.map(async (module) => {
            const groupRes = await axios.get(`/groups/module/${module.id}`);
            return [module.id, groupRes.data || []];
          })
        );

        setGroupsByModule(Object.fromEntries(groupPairs));
      } catch (error) {
        console.error("Failed to load reports data:", error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const download = async (groupId, type) => {
    try {
      const response = await axios.get(`/reports/group/${groupId}/${type}`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = `group-${groupId}-report.${type}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error(`Failed to download ${type}:`, error);
      alert("Report download failed. Ensure repository is linked and synced.");
    }
  };

  if (loading) {
    return <div className="conv-card conv-empty">Loading reports...</div>;
  }

  return (
    <div className="conv-page">
      <section className="conv-card">
        <div className="conv-panel-header">
          <div>
            <p className="conv-kicker">Reports</p>
            <h1 className="conv-panel-title">Group Summary Reports</h1>
            <p className="conv-panel-subtitle">Download evidence reports for each group in CSV or PDF format.</p>
          </div>
        </div>

        {modules.map((module) => (
          <article key={module.id} className="conv-modal-item" style={{ marginBottom: "0.7rem" }}>
            <h3>{module.name} ({module.year})</h3>

            {(groupsByModule[module.id] || []).length === 0 ? (
              <p>No groups configured for this module.</p>
            ) : (
              <div className="conv-table-wrap" style={{ marginTop: "0.5rem" }}>
                <table className="conv-table">
                  <thead>
                    <tr>
                      <th>Group</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(groupsByModule[module.id] || []).map((group) => (
                      <tr key={group.id}>
                        <td className="strong">{group.name}</td>
                        <td>
                          <div className="conv-actions">
                            <button className="conv-btn light sm" type="button" onClick={() => download(group.id, "csv")}>
                              <FileSpreadsheet className="h-3.5 w-3.5" /> CSV
                            </button>
                            <button className="conv-btn primary sm" type="button" onClick={() => download(group.id, "pdf")}>
                              <FileText className="h-3.5 w-3.5" /> PDF
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </article>
        ))}

        {modules.length === 0 && <p className="conv-empty subtle">No modules found.</p>}
      </section>

      <section className="conv-card">
        <div className="conv-panel-header compact">
          <div>
            <p className="conv-kicker">Export Tips</p>
            <h2 className="conv-panel-title small">Checklist</h2>
          </div>
          <span className="conv-chip">
            <Download className="h-3.5 w-3.5" /> Ready
          </span>
        </div>
        <ul className="conv-checklist">
          <li>Use PDF for marking panel submissions and long-form comments.</li>
          <li>Use CSV for spreadsheet analysis, moderation and cross-group comparison.</li>
          <li>Refresh group summary before exporting to include latest commits.</li>
        </ul>
      </section>
    </div>
  );
}

export default ConvenorReports;
