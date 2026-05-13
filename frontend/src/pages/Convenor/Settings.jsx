import { useState } from "react";
import { Bell, Globe, Palette, ShieldCheck, SlidersHorizontal } from "lucide-react";

const STORAGE_KEY = "convenor-dashboard-settings";

const defaultSettings = {
  compactCards: false,
  enableAnimations: true,
  notificationEmail: true,
  notificationInApp: true,
  defaultPlatform: "GITLAB",
  locale: "en-GB",
  themeAccent: "blue",
};

function ConvenorSettings() {
  const [settings, setSettings] = useState(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSettings;

    try {
      const parsed = JSON.parse(raw);
      return { ...defaultSettings, ...parsed };
    } catch {
      return defaultSettings;
    }
  });
  const [savedAt, setSavedAt] = useState("");

  const saveSettings = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    setSavedAt(new Date().toLocaleString("en-GB"));
  };

  return (
    <div className="conv-page">
      <section className="conv-card">
        <div className="conv-panel-header">
          <div>
            <p className="conv-kicker">Settings</p>
            <h1 className="conv-panel-title">Convenor Preferences</h1>
            <p className="conv-panel-subtitle">Configure workspace behavior and dashboard defaults.</p>
          </div>
          <span className="conv-chip">
            <SlidersHorizontal className="h-3.5 w-3.5" /> Personalization
          </span>
        </div>

        <div className="conv-two-col">
          <article className="conv-card">
            <h2 className="conv-panel-title small">
              <Globe className="mr-1 inline h-4 w-4" /> Regional
            </h2>
                        <label className="conv-field">
              <span className="conv-label">Locale</span>
              <select
                className="conv-select"
                value={settings.locale}
                onChange={(event) =>
                  setSettings((prev) => ({ ...prev, locale: event.target.value }))
                }
              >
                <option value="en-GB">English (UK)</option>
                <option value="en-US">English (US)</option>
              </select>
            </label>
            {/* <label className="conv-field">
              <span className="conv-label">Theme Accent</span>
              <select
                className="conv-select"
                value={settings.themeAccent}
                onChange={(event) =>
                  setSettings((prev) => ({ ...prev, themeAccent: event.target.value }))
                }
              >
                <option value="blue">Blue</option>
                <option value="green">Green</option>
                <option value="teal">Teal</option>
              </select>
            </label> */}

            {/* <label className="conv-field">
              <span className="conv-label">Compact Cards</span>
              <select
                className="conv-select"
                value={String(settings.compactCards)}
                onChange={(event) =>
                  setSettings((prev) => ({ ...prev, compactCards: event.target.value === "true" }))
                }
              >
                <option value="false">Disabled</option>
                <option value="true">Enabled</option>
              </select>
            </label> */}

            {/* <label className="conv-field">
              <span className="conv-label">Animations</span>
              <select
                className="conv-select"
                value={String(settings.enableAnimations)}
                onChange={(event) =>
                  setSettings((prev) => ({ ...prev, enableAnimations: event.target.value === "true" }))
                }
              >
                <option value="true">Enabled</option>
                <option value="false">Reduced</option>
              </select>
            </label> */}
          </article>

          <article className="conv-card">
            <h2 className="conv-panel-title small">
              <Bell className="mr-1 inline h-4 w-4" /> Notifications
            </h2>
            <label className="conv-field">
              <span className="conv-label">In-App Notifications</span>
              <select
                className="conv-select"
                value={String(settings.notificationInApp)}
                onChange={(event) =>
                  setSettings((prev) => ({ ...prev, notificationInApp: event.target.value === "true" }))
                }
              >
                <option value="true">Enabled</option>
                <option value="false">Disabled</option>
              </select>
            </label>

            <label className="conv-field">
              <span className="conv-label">Email Notifications</span>
              <select
                className="conv-select"
                value={String(settings.notificationEmail)}
                onChange={(event) =>
                  setSettings((prev) => ({ ...prev, notificationEmail: event.target.value === "true" }))
                }
              >
                <option value="true">Enabled</option>
                <option value="false">Disabled</option>
              </select>
            </label>

            <label className="conv-field">
              <span className="conv-label">Default Repository Platform</span>
              <select
                className="conv-select"
                value={settings.defaultPlatform}
                onChange={(event) =>
                  setSettings((prev) => ({ ...prev, defaultPlatform: event.target.value }))
                }
              >
                <option value="GITLAB">GitLab</option>
                <option value="GITHUB">GitHub</option>
              </select>
            </label>
          </article>
        </div>

        {/* <div className="conv-two-col">
          <article className="conv-card">
            <h2 className="conv-panel-title small">
              <Globe className="mr-1 inline h-4 w-4" /> Regional
            </h2>
            <label className="conv-field">
              <span className="conv-label">Locale</span>
              <select
                className="conv-select"
                value={settings.locale}
                onChange={(event) =>
                  setSettings((prev) => ({ ...prev, locale: event.target.value }))
                }
              >
                <option value="en-GB">English (UK)</option>
                <option value="en-US">English (US)</option>
              </select>
            </label>
          </article>

          <article className="conv-card">
            <h2 className="conv-panel-title small">
              <ShieldCheck className="mr-1 inline h-4 w-4" /> Safety
            </h2>
            <ul className="conv-checklist">
              <li>Threshold settings are applied per module and reflected in reports.</li>
              <li>Support chat notifications stay synced with admin replies.</li>
              <li>Use module-level small commit threshold for stricter quality checks.</li>
            </ul>
          </article>
        </div> */}

        <div className="conv-panel-actions end">
          <button type="button" className="conv-btn primary" onClick={saveSettings}>
            Save Settings
          </button>
        </div>

        {savedAt && (
          <p className="conv-notes">Settings saved at {savedAt}.</p>
        )}
      </section>
    </div>
  );
}

export default ConvenorSettings;
