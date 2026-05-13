import { CircleHelp, MessageSquareDot } from "lucide-react";
import { Link } from "react-router-dom";

function ConvenorHelp() {
  return (
    <div className="conv-page">
      <section className="conv-card">
        <div className="conv-panel-header">
          <div>
            <p className="conv-kicker">Help</p>
            <h1 className="conv-panel-title">Convenor Help Center</h1>
            <p className="conv-panel-subtitle">Quick guidance for analytics and support workflow.</p>
          </div>
          <span className="conv-chip">
            <CircleHelp className="h-3.5 w-3.5" /> FAQ
          </span>
        </div>

        <ul className="conv-checklist">
          <li>Use Modules to configure thresholds before evaluating student risk.</li>
          <li>Use Analytics to inspect student contribution trend and active contributors.</li>
          <li>Use Reports/Exports to generate marking evidence in PDF or CSV.</li>
          <li>Use Message Admin for system or permission support queries.</li>
        </ul>

        <div className="conv-actions" style={{ marginTop: "0.8rem" }}>
          <Link to="/convenor/messages" className="conv-btn primary">
            <MessageSquareDot className="h-4 w-4" /> Ask Admin
          </Link>
        </div>
      </section>
    </div>
  );
}

export default ConvenorHelp;
