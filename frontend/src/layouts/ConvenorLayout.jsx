import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  BookOpenText,
  ChartNoAxesColumn,
  CircleHelp,
  Download,
  FileText,
  FolderGit2,
  GraduationCap,
  LayoutDashboard,
  Layers3,
  LogOut,
  Menu,
  MessageSquareDot,
  Moon,
  Send,
  Settings2,
  Sun,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import axios from "../api/axios";
import { useTheme } from "../context/ThemeContext";

const navItems = [
  { label: "Dashboard", to: "/convenor", icon: LayoutDashboard },
  { label: "Modules", to: "/convenor/modules", icon: Layers3 },
  { label: "Groups", to: "/convenor/modules", icon: UsersRound },
  { label: "Repositories", to: "/convenor/modules", icon: FolderGit2 },
  { label: "Analytics", to: "/convenor/analytics", icon: ChartNoAxesColumn },
  { label: "Students", to: "/convenor/students", icon: GraduationCap },
  { label: "Reports", to: "/convenor/reports", icon: FileText },
  { label: "Exports", to: "/convenor/exports", icon: Download },
  { label: "Message Admin", to: "/convenor/messages", icon: MessageSquareDot },
  { label: "Settings", to: "/convenor/settings", icon: Settings2 },
  { label: "Help", to: "/convenor/help", icon: CircleHelp },
];

function FAQModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d1a2d]/45 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-[#d5deea] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#e5ebf5] px-5 py-4">
          <h2 className="text-lg font-bold text-[#1f2f47]">FAQ</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-[#7b8da8] hover:bg-[#eef3fa]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3 px-5 py-4 text-sm text-[#4f617d]">
          <article className="rounded-xl border border-[#e2e9f4] bg-[#f9fbfe] p-3">
            <h3 className="font-semibold text-[#2a3c58]">How do I create a module?</h3>
            <p className="mt-1">Open Modules, enter module settings, and submit.</p>
          </article>
          <article className="rounded-xl border border-[#e2e9f4] bg-[#f9fbfe] p-3">
            <h3 className="font-semibold text-[#2a3c58]">How do I link repositories?</h3>
            <p className="mt-1">
              Add repository URL when creating/editing groups, or use Link Repo actions.
            </p>
          </article>
          {/* <article className="rounded-xl border border-[#e2e9f4] bg-[#f9fbfe] p-3">
            <h3 className="font-semibold text-[#2a3c58]">How do I sync latest commits?</h3>
            <p className="mt-1">
              Open Group Summary and use Refresh to fetch latest commit analytics.
            </p>
          </article> */}
          <article className="rounded-xl border border-[#e2e9f4] bg-[#f9fbfe] p-3">
            <h3 className="font-semibold text-[#2a3c58]">What are flagged students?</h3>
            <p className="mt-1">
              Students can be flagged based on low-quality commits or inactivity patterns.
            </p>
          </article>
          <article className="rounded-xl border border-[#e2e9f4] bg-[#f9fbfe] p-3">
            <h3 className="font-semibold text-[#2a3c58]">How do I export reports?</h3>
            <p className="mt-1">
              Open any group report and use Export CSV or Download PDF.
            </p>
          </article>
          <article className="rounded-xl border border-[#e2e9f4] bg-[#f9fbfe] p-3">
            <h3 className="font-semibold text-[#2a3c58]">How do I contact admin?</h3>
            <p className="mt-1">
              Use the chat icon in the top-right bar to ask questions. Admin replies appear in
              notifications and chat.
            </p>
          </article>
          {/* <article className="rounded-xl border border-[#e2e9f4] bg-[#f9fbfe] p-3">
            <h3 className="font-semibold text-[#2a3c58]">Can I change inactivity thresholds?</h3>
            <p className="mt-1">
              Yes. Edit module settings to update inactivity days and expected commits.
            </p>
          </article> */}
          {/* <article className="rounded-xl border border-[#e2e9f4] bg-[#f9fbfe] p-3">
            <h3 className="font-semibold text-[#2a3c58]">Why are some commits not mapped to students?</h3>
            <p className="mt-1">
              Commit author email/username may not be linked yet. Open Group Summary to map
              contributor identities to verified students.
            </p>
          </article> */}
          {/* <article className="rounded-xl border border-[#e2e9f4] bg-[#f9fbfe] p-3">
            <h3 className="font-semibold text-[#2a3c58]">How often are notifications updated?</h3>
            <p className="mt-1">
              Notification badges refresh automatically and also update immediately when you open
              the chat.
            </p>
          </article> */}
        </div>
      </div>
    </div>
  );
}

function ChangePasswordModal({ onClose, onSubmit, loading, error, success }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();

    if (newPassword !== confirmPassword) {
      onSubmit({
        currentPassword,
        newPassword,
        confirmPasswordError: "New passwords do not match",
      });
      return;
    }

    onSubmit({ currentPassword, newPassword });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d1a2d]/45 p-4">
      <div className="w-full max-w-md rounded-2xl border border-[#d5deea] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#e5ebf5] px-5 py-4">
          <h2 className="text-lg font-bold text-[#1f2f47]">Update Password</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-[#7b8da8] hover:bg-[#eef3fa]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 px-5 py-4 text-sm">
          {error && (
            <p className="rounded-lg border border-[#f4d0d5] bg-[#fff3f5] px-3 py-2 text-[#a94b58]">
              {error}
            </p>
          )}
          {success && (
            <p className="rounded-lg border border-[#cae9d8] bg-[#eefaf3] px-3 py-2 text-[#2f7d56]">
              {success}
            </p>
          )}

          <label className="block">
            <span className="mb-1 block font-semibold text-[#2a3c58]">Current Password</span>
            <input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              className="w-full rounded-lg border border-[#d7e0ef] px-3 py-2 text-[#20334d] outline-none focus:border-[#5f7de0]"
              required
            />
          </label>
          <label className="block">
            <span className="mb-1 block font-semibold text-[#2a3c58]">New Password</span>
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="w-full rounded-lg border border-[#d7e0ef] px-3 py-2 text-[#20334d] outline-none focus:border-[#5f7de0]"
              required
            />
          </label>
          <label className="block">
            <span className="mb-1 block font-semibold text-[#2a3c58]">Confirm New Password</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="w-full rounded-lg border border-[#d7e0ef] px-3 py-2 text-[#20334d] outline-none focus:border-[#5f7de0]"
              required
            />
          </label>

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="conv-btn muted sm">
              Cancel
            </button>
            <button type="submit" className="conv-btn primary sm" disabled={loading}>
              {loading ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProfileModal({ user, onClose, onOpenChangePassword }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d1a2d]/45 p-4">
      <div className="w-full max-w-md rounded-2xl border border-[#d5deea] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#e5ebf5] px-5 py-4">
          <h2 className="text-lg font-bold text-[#1f2f47]">Profile</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-[#7b8da8] hover:bg-[#eef3fa]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3 px-5 py-4 text-sm text-[#4f617d]">
          <p>
            <span className="font-semibold text-[#2a3c58]">Name:</span> {user?.name || "N/A"}
          </p>
          <p>
            <span className="font-semibold text-[#2a3c58]">Email:</span> {user?.email || "N/A"}
          </p>
          <p>
            <span className="font-semibold text-[#2a3c58]">Role:</span> {user?.role || "CONVENOR"}
          </p>
          <p>
            <span className="font-semibold text-[#2a3c58]">User ID:</span> {user?.id || "N/A"}
          </p>

          <div className="rounded-xl border border-[#deebf7] bg-[#f8fbff] p-3">
            <p className="text-xs uppercase tracking-wide text-[#6e86a4]">Account Security</p>
            <button
              type="button"
              onClick={onOpenChangePassword}
              className="mt-2 w-full rounded-lg border border-[#d5dff0] bg-white px-3 py-2 text-left font-semibold text-[#304a70] hover:bg-[#f3f7fd]"
            >
              Change / Update Password
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConvenorChatModal({
  open,
  onClose,
  threads,
  activeThreadId,
  activeThread,
  onSelectThread,
  onCreateQuestion,
  onReply,
  createSubject,
  setCreateSubject,
  createMessage,
  setCreateMessage,
  replyMessage,
  setReplyMessage,
  loading,
  error,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d1a2d]/45 p-4">
      <div className="grid h-[84vh] w-full max-w-5xl grid-cols-1 overflow-hidden rounded-2xl border border-[#d5deea] bg-white shadow-2xl md:h-[80vh] md:grid-cols-[300px_1fr]">
        <aside className="border-b border-[#e6edf7] bg-[#f8fbff] md:border-b-0 md:border-r">
          <div className="border-b border-[#e6edf7] px-4 py-3">
            <h2 className="text-lg font-bold text-[#1f2f47]">Admin Chat</h2>
            <p className="text-xs text-[#6f87a6]">Ask questions and track replies.</p>
          </div>
          <div className="max-h-[32vh] space-y-2 overflow-y-auto p-3 md:max-h-[calc(80vh-74px)]">
            {threads.length === 0 && (
              <p className="rounded-lg border border-dashed border-[#d4e0ef] bg-white p-3 text-sm text-[#607b9c]">
                No questions yet. Create one from the panel.
              </p>
            )}
            {threads.map((thread) => (
              <button
                key={thread.id}
                type="button"
                onClick={() => onSelectThread(thread.id)}
                className={`w-full rounded-lg border px-3 py-2 text-left transition ${
                  thread.id === activeThreadId
                    ? "border-[#7ea2e4] bg-[#eef4ff]"
                    : "border-[#d9e4f3] bg-white hover:bg-[#f4f8ff]"
                }`}
              >
                <p className="truncate text-sm font-semibold text-[#2b4262]">{thread.subject}</p>
                <p className="mt-1 text-xs text-[#6e88a8]">
                  {thread.unreadCount > 0 ? `${thread.unreadCount} unread` : "No unread"}
                </p>
              </button>
            ))}
          </div>
        </aside>

        <section className="flex flex-col">
          <div className="flex items-center justify-between border-b border-[#e6edf7] px-4 py-3">
            <div>
              <h3 className="text-base font-bold text-[#1f2f47]">
                {activeThread?.subject || "New Question"}
              </h3>
              <p className="text-xs text-[#6f87a6]">
                {activeThread ? `Status: ${activeThread.status}` : "Start a new thread below"}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1.5 text-[#7b8da8] hover:bg-[#eef3fa]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {error && (
            <p className="mx-4 mt-3 rounded-lg border border-[#f4d0d5] bg-[#fff3f5] px-3 py-2 text-sm text-[#a94b58]">
              {error}
            </p>
          )}

          {!activeThread && (
            <div className="space-y-3 border-b border-[#e6edf7] px-4 py-3">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#6f87a6]">
                  Subject
                </span>
                <input
                  value={createSubject}
                  onChange={(event) => setCreateSubject(event.target.value)}
                  className="w-full rounded-lg border border-[#d7e0ef] px-3 py-2 text-[#20334d] outline-none focus:border-[#5f7de0]"
                  placeholder="Example: GitLab member permission issue"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#6f87a6]">
                  Message
                </span>
                <textarea
                  rows={3}
                  value={createMessage}
                  onChange={(event) => setCreateMessage(event.target.value)}
                  className="w-full rounded-lg border border-[#d7e0ef] px-3 py-2 text-[#20334d] outline-none focus:border-[#5f7de0]"
                  placeholder="Describe your question in detail..."
                />
              </label>
              <button
                type="button"
                onClick={onCreateQuestion}
                className="conv-btn primary sm"
                disabled={loading}
              >
                {loading ? "Sending..." : "Submit Question"}
              </button>
            </div>
          )}

          <div className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
            {(activeThread?.messages || []).map((item) => (
              <div
                key={item.id}
                className={`max-w-[82%] rounded-xl border px-3 py-2 text-sm ${
                  item.senderRole === "CONVENOR"
                    ? "ml-auto border-[#cfe1ff] bg-[#eef4ff] text-[#27486d]"
                    : "border-[#e3ebf6] bg-[#f9fcff] text-[#355073]"
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-[#6b84a2]">
                  {item.senderName} ({item.senderRole})
                </p>
                <p className="mt-1 whitespace-pre-wrap">{item.message}</p>
                <p className="mt-1 text-[11px] text-[#7b90aa]">
                  {new Date(item.createdAt).toLocaleString("en-GB")}
                </p>
              </div>
            ))}
          </div>

          {activeThread && (
            <div className="border-t border-[#e6edf7] px-4 py-3">
              <div className="flex gap-2">
                <input
                  value={replyMessage}
                  onChange={(event) => setReplyMessage(event.target.value)}
                  className="flex-1 rounded-lg border border-[#d7e0ef] px-3 py-2 text-[#20334d] outline-none focus:border-[#5f7de0]"
                  placeholder="Write a follow-up message..."
                />
                <button
                  type="button"
                  onClick={onReply}
                  className="conv-btn primary sm"
                  disabled={loading}
                >
                  <Send className="h-3.5 w-3.5" />
                  Send
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function ConvenorLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState("");
  const [changePasswordSuccess, setChangePasswordSuccess] = useState("");

  const [threads, setThreads] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [activeThread, setActiveThread] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [supportLoading, setSupportLoading] = useState(false);
  const [supportError, setSupportError] = useState("");
  const [createSubject, setCreateSubject] = useState("");
  const [createMessage, setCreateMessage] = useState("");
  const [replyMessage, setReplyMessage] = useState("");

  const menuRef = useRef(null);
  const notificationRef = useRef(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await axios.get("/auth/me");
        setUser(response.data);
      } catch (error) {
        console.error("Failed to fetch current user:", error);
      }
    };

    fetchCurrentUser();
  }, []);

  useEffect(() => {
    const loadSupportNotifications = async () => {
      try {
        const response = await axios.get("/support/convenor/notifications");
        setNotifications(response.data?.notifications || []);
        setUnreadNotificationCount(Number(response.data?.unreadCount || 0));
      } catch (error) {
        console.error("Failed to fetch support notifications:", error);
      }
    };

    loadSupportNotifications();
    const intervalId = setInterval(loadSupportNotifications, 25000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const onMouseDown = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setMenuOpen(false);
      }
      if (!notificationRef.current?.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const avatar = user?.name?.charAt(0)?.toUpperCase() || "C";
  const sectionLabel = useMemo(() => {
    if (location.pathname === "/convenor") return "Dashboard";
    if (location.pathname.startsWith("/convenor/analytics")) return "Analytics";
    if (location.pathname.startsWith("/convenor/students")) return "Students";
    if (location.pathname.startsWith("/convenor/modules")) return "Modules";
    if (location.pathname.startsWith("/convenor/messages")) return "Message Admin";
    if (location.pathname.startsWith("/convenor/settings")) return "Settings";
    if (location.pathname.startsWith("/convenor/reports")) return "Reports";
    if (location.pathname.startsWith("/convenor/exports")) return "Exports";
    if (location.pathname.startsWith("/convenor/help")) return "Help";
    return "Dashboard";
  }, [location.pathname]);

  const loadThreads = async () => {
    try {
      const response = await axios.get("/support/convenor/threads");
      const rows = response.data || [];
      setThreads(rows);

      if (!rows.length) {
        setActiveThreadId(null);
        setActiveThread(null);
        return;
      }

      const preferredId = activeThreadId || rows[0].id;
      setActiveThreadId(preferredId);
      await loadThreadMessages(preferredId);
    } catch (error) {
      console.error("Failed to load threads:", error);
      setSupportError("Failed to load chat threads");
    }
  };

  const loadThreadMessages = async (threadId) => {
    try {
      const response = await axios.get(`/support/convenor/threads/${threadId}/messages`);
      setActiveThread(response.data);
      setActiveThreadId(threadId);
      await axios.post("/support/convenor/notifications/read");
      const notificationResponse = await axios.get("/support/convenor/notifications");
      setNotifications(notificationResponse.data?.notifications || []);
      setUnreadNotificationCount(Number(notificationResponse.data?.unreadCount || 0));
    } catch (error) {
      console.error("Failed to load thread messages:", error);
      setSupportError("Failed to load thread messages");
    }
  };

  const openChat = async (threadId = null) => {
    setShowChat(true);
    setSupportError("");
    await loadThreads();
    if (threadId) {
      await loadThreadMessages(threadId);
    }
  };

  const submitNewQuestion = async () => {
    const subject = String(createSubject || "").trim();
    const message = String(createMessage || "").trim();
    if (!message) {
      setSupportError("Please enter your question message");
      return;
    }

    try {
      setSupportLoading(true);
      setSupportError("");
      await axios.post("/support/convenor/questions", {
        subject,
        message,
      });
      setCreateSubject("");
      setCreateMessage("");
      await loadThreads();
    } catch (error) {
      setSupportError(error.response?.data?.message || "Failed to submit question");
    } finally {
      setSupportLoading(false);
    }
  };

  const submitReply = async () => {
    const message = String(replyMessage || "").trim();
    if (!message || !activeThreadId) return;

    try {
      setSupportLoading(true);
      setSupportError("");
      await axios.post(`/support/convenor/threads/${activeThreadId}/messages`, {
        message,
      });
      setReplyMessage("");
      await loadThreadMessages(activeThreadId);
      await loadThreads();
    } catch (error) {
      setSupportError(error.response?.data?.message || "Failed to send message");
    } finally {
      setSupportLoading(false);
    }
  };

  const handleChangePassword = async ({ currentPassword, newPassword, confirmPasswordError }) => {
    if (confirmPasswordError) {
      setChangePasswordError(confirmPasswordError);
      setChangePasswordSuccess("");
      return;
    }

    try {
      setChangePasswordLoading(true);
      setChangePasswordError("");
      setChangePasswordSuccess("");
      const response = await axios.put("/auth/change-password", {
        currentPassword,
        newPassword,
      });
      setChangePasswordSuccess(response.data?.message || "Password updated successfully");
    } catch (error) {
      setChangePasswordError(error.response?.data?.message || "Failed to update password");
    } finally {
      setChangePasswordLoading(false);
    }
  };

  return (
    <div className={`convenor-shell min-h-screen ${isDark ? "theme-dark" : "theme-light"} bg-[#f5f7fb]`}>
      <div className="mx-auto flex w-full max-w-[1760px] gap-0 overflow-x-hidden">
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-[248px] border-r border-[#22395f] bg-gradient-to-b from-[#102541] via-[#122e55] to-[#0f2747] text-white transition-transform duration-300 md:static md:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex h-full flex-col">
            <div className="border-b border-white/10 px-5 py-5">
              <p className="flex items-center gap-2.5 text-xl font-bold tracking-tight">
                <BookOpenText className="h-5.5 w-5.5 text-[#8dc4ff]" />
                Git Tracker
              </p>
              <p className="mt-1 text-xs text-[#a6bddf]">Convenor Workspace</p>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active =
                  location.pathname === item.to ||
                  (item.to !== "/convenor" && location.pathname.startsWith(item.to));

                return (
                  <NavLink
                    key={item.label}
                    to={item.to}
                    className={`flex items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-sm font-semibold transition ${
                      active
                        ? "bg-[#2f67ae] text-white shadow-lg shadow-[#1f4f88]/40"
                        : "text-[#d4e0f3] hover:bg-white/10 hover:text-white"
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>

            <div className="border-t border-white/10 p-3">
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-[#ffd3d3] transition hover:bg-[#3f1f2f]"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </aside>

        <div className="min-h-screen flex-1 overflow-x-hidden">
          <header className="convenor-header sticky top-0 z-30 border-b border-[#dde5f1] bg-white px-4 py-3 md:px-7">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSidebarOpen((prev) => !prev)}
                  className="rounded-lg border border-[#d6dfee] bg-white p-2 text-[#51647f] md:hidden"
                >
                  <Menu className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d5e0ef] bg-[#f1f6ff] text-sm font-bold text-[#2a4f80]">
                    <BookOpenText className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#26374f]">Git Tracker Tool</p>
                    <p className="text-xs text-[#6b82a1]">{sectionLabel}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="rounded-lg border border-[#dce5f2] bg-white p-2 text-[#627795] hover:bg-[#f5f8fc]"
                  title={isDark ? "Switch to light mode" : "Switch to dark mode"}
                  aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
                >
                  {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>

                <div className="relative" ref={notificationRef}>
                  <button
                    type="button"
                    onClick={() => setShowNotifications((prev) => !prev)}
                    className="relative rounded-lg border border-[#dce5f2] bg-white p-2 text-[#627795] hover:bg-[#f5f8fc]"
                  >
                    <Bell className="h-4 w-4" />
                    {unreadNotificationCount > 0 && (
                      <span className="absolute -right-1 -top-1 rounded-full bg-[#d84461] px-1.5 py-0.5 text-[10px] font-bold text-white">
                        {unreadNotificationCount}
                      </span>
                    )}
                  </button>

                  {showNotifications && (
                    <div className="absolute right-0 top-11 z-50 w-80 rounded-xl border border-[#d6deea] bg-white shadow-lg">
                      <div className="flex items-center justify-between border-b border-[#e8eef7] px-3 py-2">
                        <p className="text-sm font-bold text-[#29415f]">Notifications</p>
                        <button
                          type="button"
                          onClick={async () => {
                            await axios.post("/support/convenor/notifications/read");
                            setNotifications([]);
                            setUnreadNotificationCount(0);
                          }}
                          className="text-xs font-semibold text-[#4a67a0]"
                        >
                          Mark all read
                        </button>
                      </div>
                      <div className="max-h-80 overflow-y-auto p-2">
                        {notifications.length === 0 && (
                          <p className="rounded-lg border border-dashed border-[#dbe5f3] p-3 text-sm text-[#5e799b]">
                            No unread admin replies.
                          </p>
                        )}
                        {notifications.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={async () => {
                              setShowNotifications(false);
                              await openChat(item.threadId);
                            }}
                            className="mb-2 w-full rounded-lg border border-[#e2eaf6] bg-[#f9fbff] p-2 text-left hover:bg-[#f2f7ff]"
                          >
                            <p className="text-xs font-semibold text-[#395a85]">{item.threadSubject}</p>
                            <p className="mt-1 line-clamp-2 text-sm text-[#2f486d]">{item.message}</p>
                            <p className="mt-1 text-[11px] text-[#6f88a8]">
                              {new Date(item.createdAt).toLocaleString("en-GB")}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => openChat()}
                  className="rounded-lg border border-[#dce5f2] bg-white p-2 text-[#627795] hover:bg-[#f5f8fc]"
                >
                  <MessageSquareDot className="h-4 w-4" />
                </button>

                <div className="relative" ref={menuRef}>
                  <button
                    type="button"
                    onClick={() => setMenuOpen((prev) => !prev)}
                    className="flex items-center gap-2 rounded-lg border border-[#dce5f2] bg-white px-2.5 py-1.5 hover:bg-[#f5f8fc]"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e7eef9] text-xs font-extrabold text-[#2a3f62]">
                      {avatar}
                    </div>
                    <div className="hidden md:block">
                      <p className="text-sm font-semibold text-[#344a68]">
                        {user?.name || "Convenor"}
                      </p>
                      <p className="text-[11px] text-[#7b90aa]">Convenor</p>
                    </div>
                  </button>

                  {menuOpen && (
                    <div className="absolute right-0 top-11 z-50 w-56 overflow-hidden rounded-xl border border-[#d6deea] bg-white shadow-lg">
                      <button
                        type="button"
                        onClick={() => {
                          setShowProfile(true);
                          setMenuOpen(false);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-semibold text-[#41597a] hover:bg-[#f3f7fc]"
                      >
                        <UserRound className="h-4 w-4" />
                        Profile
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowChangePassword(true);
                          setChangePasswordError("");
                          setChangePasswordSuccess("");
                          setMenuOpen(false);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-semibold text-[#41597a] hover:bg-[#f3f7fc]"
                      >
                        <UserRound className="h-4 w-4" />
                        Change Password
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowFAQ(true);
                          setMenuOpen(false);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-semibold text-[#41597a] hover:bg-[#f3f7fc]"
                      >
                        <CircleHelp className="h-4 w-4" />
                        FAQ
                      </button>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-semibold text-[#b64a57] hover:bg-[#fff4f5]"
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          <main className="convenor-main p-4 md:p-7">
            <Outlet context={{ user }} />
          </main>
        </div>
      </div>

      {showProfile && (
        <ProfileModal
          user={user}
          onClose={() => setShowProfile(false)}
          onOpenChangePassword={() => {
            setShowProfile(false);
            setShowChangePassword(true);
            setChangePasswordError("");
            setChangePasswordSuccess("");
          }}
        />
      )}
      {showFAQ && <FAQModal onClose={() => setShowFAQ(false)} />}
      {showChangePassword && (
        <ChangePasswordModal
          onClose={() => setShowChangePassword(false)}
          onSubmit={handleChangePassword}
          loading={changePasswordLoading}
          error={changePasswordError}
          success={changePasswordSuccess}
        />
      )}
      <ConvenorChatModal
        open={showChat}
        onClose={() => setShowChat(false)}
        threads={threads}
        activeThreadId={activeThreadId}
        activeThread={activeThread}
        onSelectThread={loadThreadMessages}
        onCreateQuestion={submitNewQuestion}
        onReply={submitReply}
        createSubject={createSubject}
        setCreateSubject={setCreateSubject}
        createMessage={createMessage}
        setCreateMessage={setCreateMessage}
        replyMessage={replyMessage}
        setReplyMessage={setReplyMessage}
        loading={supportLoading}
        error={supportError}
      />

      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-[#0f1f38]/40 md:hidden"
        />
      )}
    </div>
  );
}

export default ConvenorLayout;
