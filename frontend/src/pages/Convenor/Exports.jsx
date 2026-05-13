import { ArrowRight, DownloadCloud, FileSpreadsheet, FileText, FolderArchive } from "lucide-react";
import { Link } from "react-router-dom";

function ConvenorExports() {
  return (
    <div className="conv-page">
      <section className="conv-card">
        <div className="conv-panel-header">
          <div>
            <p className="conv-kicker">Exports</p>
            <h1 className="conv-panel-title">Data Export Center</h1>
            <p className="conv-panel-subtitle">Choose export formats and move to report generation quickly.</p>
          </div>
        </div>

        <div className="conv-grid-3">
          <article className="conv-stat-card">
            <p className="conv-kicker"><FileText className="inline h-3.5 w-3.5" /> PDF Exports</p>
            <h2 className="conv-stat-value">Marking Ready</h2>
            <p className="conv-stat-note">Structured evidence summary with flags</p>
          </article>

          <article className="conv-stat-card">
            <p className="conv-kicker"><FileSpreadsheet className="inline h-3.5 w-3.5" /> CSV Exports</p>
            <h2 className="conv-stat-value">Spreadsheet Ready</h2>
            <p className="conv-stat-note">Great for moderation and analytics</p>
          </article>

          <article className="conv-stat-card">
            <p className="conv-kicker"><FolderArchive className="inline h-3.5 w-3.5" /> Archive</p>
            <h2 className="conv-stat-value">Manual Bundle</h2>
            <p className="conv-stat-note">Download per-group and organize by module</p>
          </article>
        </div>

        <div className="conv-panel-actions end" style={{ marginTop: "0.8rem" }}>
          <Link className="conv-btn primary" to="/convenor/reports">
            <DownloadCloud className="h-4 w-4" /> Open Report Downloads <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

export default ConvenorExports;
