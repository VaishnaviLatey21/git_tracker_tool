import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  BellRing,
  CheckCircle2,
  Clock3,
  GitBranch,
  ShieldCheck,
  Sparkles,
  Users,
  Workflow,
} from "lucide-react";

const projectStats = [
  { label: "Repositories Tracked", value: "120+" },
  { label: "Student Teams", value: "45" },
  { label: "Commit Events", value: "28K+" },
];

const featureCards = [
  {
    title: "Live Group Analytics",
    description:
      "Track commit trends, code quality, and inactivity in one streamlined convenor cockpit.",
    icon: BarChart3,
  },
  {
    title: "Smart Risk Signals",
    description:
      "Early warnings for low contribution, inactivity, and small commits help intervene on time.",
    icon: BellRing,
  },
  {
    title: "Identity Mapping",
    description:
      "Consolidate contributors across GitHub and GitLab so student effort is measured fairly.",
    icon: GitBranch,
  },
  {
    title: "Role-Based Access",
    description:
      "Convenor-first workflows with secure authentication and protected routes for each user type.",
    icon: ShieldCheck,
  },
];

const flowSteps = [
  { title: "Create Module", detail: "Set thresholds and timeline rules." },
  { title: "Link Groups", detail: "Attach repositories and student members." },
  { title: "Watch Activity", detail: "Review commits, trends, and quality flags." },
  { title: "Export Reports", detail: "Generate summary snapshots for reviews." },
];

function Landing() {
  return (
    <div className="landing-shell">
      <div className="landing-grid" aria-hidden="true" />
      <div className="landing-glow landing-glow-one" aria-hidden="true" />
      <div className="landing-glow landing-glow-two" aria-hidden="true" />
      <div className="landing-noise" aria-hidden="true" />

      <header className="landing-nav">
        <a className="landing-brand" href="#top">
          <span className="landing-brand-mark">GT</span>
          <span className="landing-brand-text">Git Tracker Tool</span>
        </a>
        <nav className="landing-nav-links">
          <a href="#features">Features</a>
          <a href="#workflow">Workflow</a>
        </nav>
        <div className="landing-nav-actions">
          <Link className="landing-btn landing-btn-ghost" to="/login">
            Login
          </Link>
          <Link className="landing-btn landing-btn-primary" to="/register">
            Sign Up
          </Link>
        </div>
      </header>

      <main id="top" className="landing-main">
        <section className="landing-hero">
          <div className="landing-copy">
            <div className="landing-chip">
              <Sparkles size={14} />
              Convenor Dashboard Platform
            </div>
            <h1>See student project momentum before problems grow.</h1>
            <p>
              Git Tracker Tool gives convenors a visual command center for
              modules, groups, repositories, and contributor activity across the
              full semester timeline.
            </p>
            <div className="landing-cta-row">
              <Link className="landing-btn landing-btn-primary" to="/register">
                Start 
                <ArrowRight size={16} />
              </Link>
              <Link className="landing-btn landing-btn-ghost" to="/login">
                Existing Account
              </Link>
            </div>

            <div className="landing-stat-grid">
              {projectStats.map((item) => (
                <article key={item.label} className="landing-stat-card">
                  <h3>{item.value}</h3>
                  <p>{item.label}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="landing-visual">
            <div className="landing-orbit landing-orbit-one" />
            <div className="landing-orbit landing-orbit-two" />
            <article className="landing-window">
              <header className="landing-window-top">
                <div className="landing-window-dot-group">
                  <span />
                  <span />
                  <span />
                </div>
                <p>Repository Analysis</p>
              </header>

              <div className="landing-window-kpis">
                <div>
                  <Users size={15} />
                  <span>36 Active Students</span>
                </div>
                <div>
                  <Clock3 size={15} />
                  <span>7 Inactivity Alerts</span>
                </div>
                <div>
                  <Workflow size={15} />
                  <span>12 Reports Generated</span>
                </div>
              </div>

              <div className="landing-window-chart">
                <svg
                  viewBox="0 0 400 170"
                  preserveAspectRatio="none"
                  role="img"
                  aria-label="Project analytics trend lines"
                >
                  <defs>
                    <linearGradient
                      id="lineA"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="0%"
                    >
                      <stop offset="0%" stopColor="#19c4b4" />
                      <stop offset="100%" stopColor="#42f5df" />
                    </linearGradient>
                    <linearGradient
                      id="lineB"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="0%"
                    >
                      <stop offset="0%" stopColor="#f8a642" />
                      <stop offset="100%" stopColor="#ffd08a" />
                    </linearGradient>
                  </defs>
                  <polyline
                    className="landing-line landing-line-a"
                    points="0,120 70,90 140,105 210,60 280,75 350,40 400,32"
                    fill="none"
                    stroke="url(#lineA)"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                  <polyline
                    className="landing-line landing-line-b"
                    points="0,130 70,125 140,98 210,86 280,93 350,80 400,70"
                    fill="none"
                    stroke="url(#lineB)"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </article>

            <aside className="landing-alert">
              <p>Inactivity Flag</p>
              <h4>PSCM Group 3</h4>
              <span>5 days since last push</span>
              <CheckCircle2 size={16} />
            </aside>
          </div>
        </section>

        <section id="features" className="landing-section">
          <h2>Built for real convenor workflows</h2>
          <p>
            Everything from module setup to report exports is designed for
            academic supervision.
          </p>
          <div className="landing-feature-grid">
            {featureCards.map((feature) => {
              const Icon = feature.icon;
              return (
                <article key={feature.title} className="landing-feature-card">
                  <div className="landing-icon-wrap">
                    <Icon size={18} />
                  </div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section id="workflow" className="landing-section">
          <h2>How the platform fits your timeline</h2>
          <div className="landing-flow-grid">
            {flowSteps.map((step, index) => (
              <article key={step.title} className="landing-flow-card">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{step.title}</h3>
                <p>{step.detail}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default Landing;
