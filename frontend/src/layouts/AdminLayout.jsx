import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  Bell,
  BookOpen,
  CheckCircle2,
  Cog,
  FileText,
  FolderKanban,
  GitBranch,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  ShieldCheck,
  Sun,
  UserCog,
  Users,
  X,
} from "lucide-react";
import axios from "../api/axios";
import { useTheme } from "../context/ThemeContext";

const navItems = [
  { label: "Dashboard", to: "/admin", icon: Activity },
  { label: "Users", to: "/admin/users", icon: Users },
  { label: "Roles & Permissions", to: "/admin/roles", icon: UserCog },
  { label: "Modules", to: "/admin/modules", icon: BookOpen },
  // { label: "Groups", to: "/admin/groups", icon: FolderKanban },
  // { label: "Repositories", to: "/admin/repositories", icon: GitBranch },
  { label: "System Settings", to: "/admin/settings", icon: Cog },
  { label: "Logs & Activity", to: "/admin/logs", icon: FileText },
];

const formatRelativeDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [supportChatOpen, setSupportChatOpen] = useState(false);

  const [adminNotifications, setAdminNotifications] = useState([]);
  const [threads, setThreads] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [activeThread, setActiveThread] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [markResolved, setMarkResolved] = useState(false);

  const [supportLoading, setSupportLoading] = useState(false);
  const [threadLoading, setThreadLoading] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  const [supportError, setSupportError] = useState("");

  const menuRef = useRef(null);
  const notificationsRef = useRef(null);

  const fetchAdminNotifications = async () => {
    try {
      const response = await axios.get("/support/admin/notifications");
      setAdminNotifications(response.data?.notifications || []);
    } catch (error) {
      console.error("Failed to fetch admin notifications:", error);
    }
  };

  const loadThreadMessages = async (threadId) => {
    if (!threadId) return;

    setThreadLoading(true);
    setSupportError("");

    try {
      const response = await axios.get(`/support/admin/threads/${threadId}/messages`);
      setActiveThread(response.data || null);
      setActiveThreadId(threadId);
      await fetchAdminNotifications();
    } catch (error) {
      console.error("Failed to load support thread:", error);
      setSupportError(error.response?.data?.message || "Failed to load thread");
    } finally {
      setThreadLoading(false);
    }
  };

  const loadThreads = async (preferredThreadId = null) => {
    setSupportLoading(true);
    setSupportError("");

    try {
      const response = await axios.get("/support/admin/threads");
      const rows = response.data || [];
      setThreads(rows);

      const targetThreadId =
        preferredThreadId || activeThreadId || rows[0]?.id || null;

      if (targetThreadId) {
        await loadThreadMessages(targetThreadId);
      } else {
        setActiveThreadId(null);
        setActiveThread(null);
      }
    } catch (error) {
      console.error("Failed to load support threads:", error);
      setSupportError(error.response?.data?.message || "Failed to load support inbox");
    } finally {
      setSupportLoading(false);
    }
  };

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
    fetchAdminNotifications();

    const intervalId = window.setInterval(fetchAdminNotifications, 25000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const onMouseDown = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setMenuOpen(false);
      }

      if (!notificationsRef.current?.contains(event.target)) {
        setNotificationOpen(false);
      }
    };

    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  useEffect(() => {
    if (!supportChatOpen) return;
    loadThreads();
  }, [supportChatOpen]);

  const sectionLabel = useMemo(() => {
    if (location.pathname === "/admin") return "Dashboard";
    if (location.pathname.startsWith("/admin/users")) return "User Management";
    if (location.pathname.startsWith("/admin/roles")) return "Roles & Permissions";
    if (location.pathname.startsWith("/admin/modules")) return "Modules";
    // if (location.pathname.startsWith("/admin/groups")) return "Groups";
    // if (location.pathname.startsWith("/admin/repositories")) return "Repositories";
    if (location.pathname.startsWith("/admin/settings")) return "System Settings";
    if (location.pathname.startsWith("/admin/logs")) return "Logs & Activity";
    return "Admin Dashboard";
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/admin/login");
  };

  const handleNotificationClick = async (item) => {
    setNotificationOpen(false);
    setSupportChatOpen(true);

    try {
      await axios.post("/support/admin/notifications/read");
    } catch (error) {
      console.error("Failed to mark admin notifications as read:", error);
    }

    await fetchAdminNotifications();
    await loadThreads(item.threadId);
  };

  const markAllNotificationsRead = async () => {
    try {
      await axios.post("/support/admin/notifications/read");
      await fetchAdminNotifications();
    } catch (error) {
      console.error("Failed to mark notifications as read:", error);
    }
  };

  const submitReply = async (event) => {
    event.preventDefault();
    if (!activeThreadId || !replyText.trim()) return;

    setSendingReply(true);
    setSupportError("");

    try {
      await axios.post(`/support/admin/threads/${activeThreadId}/reply`, {
        message: replyText.trim(),
        markResolved,
      });

      setReplyText("");
      setMarkResolved(false);

      await loadThreads(activeThreadId);
      await fetchAdminNotifications();
    } catch (error) {
      console.error("Failed to send admin reply:", error);
      setSupportError(error.response?.data?.message || "Failed to send reply");
    } finally {
      setSendingReply(false);
    }
  };

  const openSupportInbox = async (threadId = null) => {
    setSupportChatOpen(true);
    await loadThreads(threadId);
  };

  const avatar = user?.name?.charAt(0)?.toUpperCase() || "A";
  const unreadCount = adminNotifications.length;

  return (
    <div className={`admin-shell min-h-screen ${isDark ? "theme-dark" : "theme-light"} bg-[#f4f6fb]`}>
      <div className="mx-auto flex w-full max-w-[1760px] overflow-x-hidden">
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-[252px] border-r border-[#1a4e31] bg-gradient-to-b from-[#0f3a25] via-[#134b2f] to-[#103528] text-white transition-transform duration-300 md:static md:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex h-full flex-col">
            <div className="border-b border-white/10 px-5 py-5">
              <p className="flex items-center gap-2.5 text-xl font-bold tracking-tight">
                <ShieldCheck className="h-5 w-5 text-[#bce9cf]" />
                Git Tracker Tool
              </p>
              <p className="mt-1 text-xs text-[#c6ebd7]">Admin Interface</p>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active =
                  location.pathname === item.to ||
                  (item.to !== "/admin" && location.pathname.startsWith(item.to));

                return (
                  <NavLink
                    key={item.label}
                    to={item.to}
                    className={`flex items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-sm font-semibold transition ${
                      active
                        ? "bg-[#1b6b43] text-white shadow-lg shadow-[#103f29]/40"
                        : "text-[#d8f0e1] hover:bg-white/10 hover:text-white"
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
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-[#ffdce1] transition hover:bg-[#4f1f36]"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </aside>

        <div className="min-h-screen flex-1 overflow-x-hidden">
          <header className="admin-header sticky top-0 z-30 border-b border-[#dee4f0] bg-white px-4 py-3 md:px-7">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSidebarOpen((prev) => !prev)}
                  className="rounded-lg border border-[#d6dfee] bg-white p-2 text-[#51647f] md:hidden"
                >
                  <Menu className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d5e0ef] bg-[#f1f6ff] text-sm font-bold text-[#2a4f80]">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#28354a]">Git Tracker Tool</p>
                    <p className="text-xs text-[#7288a7]">{sectionLabel}</p>
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

                <div className="relative" ref={notificationsRef}>
                  <button
                    type="button"
                    onClick={() => setNotificationOpen((prev) => !prev)}
                    className="relative rounded-lg border border-[#dce5f2] bg-white p-2 text-[#627795] hover:bg-[#f5f8fc]"
                  >
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#d6455f] px-1 text-[10px] font-bold text-white">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>

                  {notificationOpen && (
                    <div className="absolute right-0 top-11 z-50 w-[340px] overflow-hidden rounded-xl border border-[#d6deea] bg-white shadow-lg">
                      <div className="flex items-center justify-between border-b border-[#e6edf8] px-3 py-2">
                        <p className="text-sm font-semibold text-[#2a3f60]">
                          Convenor Notifications
                        </p>
                        {unreadCount > 0 && (
                          <button
                            type="button"
                            onClick={markAllNotificationsRead}
                            className="text-xs font-semibold text-[#3e66a0] hover:text-[#2f4f7f]"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-[320px] overflow-y-auto">
                        {adminNotifications.length === 0 && (
                          <p className="px-3 py-3 text-sm text-[#5e7799]">
                            No unread messages.
                          </p>
                        )}
                        {adminNotifications.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleNotificationClick(item)}
                            className="w-full border-b border-[#edf2f9] px-3 py-2 text-left transition hover:bg-[#f7faff]"
                          >
                            <p className="text-xs font-semibold uppercase tracking-wide text-[#607a9f]">
                              {item.convenorName}
                            </p>
                            <p className="mt-0.5 text-sm font-semibold text-[#2a3f60]">
                              {item.threadSubject}
                            </p>
                            <p className="mt-1 line-clamp-2 text-xs text-[#5a7292]">
                              {item.message}
                            </p>
                            <p className="mt-1 text-[11px] text-[#7f94b2]">
                              {formatRelativeDate(item.createdAt)}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setSupportChatOpen(true)}
                  className="relative rounded-lg border border-[#dce5f2] bg-white p-2 text-[#627795] hover:bg-[#f5f8fc]"
                >
                  <MessageSquare className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#2f73c4] px-1 text-[10px] font-bold text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                <div className="relative" ref={menuRef}>
                  <button
                    type="button"
                    onClick={() => setMenuOpen((prev) => !prev)}
                    className="flex items-center gap-2 rounded-lg border border-[#dce5f2] bg-white px-2.5 py-1.5 hover:bg-[#f5f8fc]"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e8edff] text-xs font-extrabold text-[#2a3f62]">
                      {avatar}
                    </div>
                    <div className="hidden md:block">
                      <p className="text-sm font-semibold text-[#344a68]">
                        {user?.name || "Admin User"}
                      </p>
                      <p className="text-[11px] text-[#7b90aa]">Administrator</p>
                    </div>
                  </button>

                  {menuOpen && (
                    <div className="absolute right-0 top-11 z-50 w-48 overflow-hidden rounded-xl border border-[#d6deea] bg-white shadow-lg">
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

          <main className="admin-main p-4 md:p-7">
            <Outlet
              context={{
                user,
                unreadSupportCount: unreadCount,
                supportNotifications: adminNotifications,
                openSupportInbox,
              }}
            />
          </main>
        </div>
      </div>

      {supportChatOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#0f1f38]/35 p-4 backdrop-blur-[1px]">
          <div className="flex h-[86vh] w-full max-w-[1120px] flex-col overflow-hidden rounded-2xl border border-[#d4deee] bg-white shadow-2xl md:flex-row">
            <aside className="w-full border-b border-[#e1e8f3] bg-[#f8fbff] md:w-[320px] md:border-b-0 md:border-r">
              <div className="flex items-center justify-between border-b border-[#e1e8f3] px-4 py-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#6981a3]">
                    Support Inbox
                  </p>
                  <h2 className="text-lg font-bold text-[#263a58]">Convenor Questions</h2>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSupportChatOpen(false);
                    setReplyText("");
                    setMarkResolved(false);
                    setSupportError("");
                  }}
                  className="rounded-lg border border-[#d6deea] bg-white p-1.5 text-[#627795]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="max-h-[calc(32vh-66px)] overflow-y-auto p-2 md:max-h-[calc(86vh-66px)]">
                {(supportLoading || threadLoading) && threads.length === 0 && (
                  <p className="rounded-xl bg-white px-3 py-3 text-sm text-[#5e7698]">
                    Loading threads...
                  </p>
                )}

                {!supportLoading && threads.length === 0 && (
                  <p className="rounded-xl border border-dashed border-[#cfdbeb] bg-white px-3 py-3 text-sm text-[#5e7698]">
                    No convenor messages yet.
                  </p>
                )}

                {threads.map((thread) => {
                  const active = thread.id === activeThreadId;
                  return (
                    <button
                      key={thread.id}
                      type="button"
                      onClick={() => loadThreadMessages(thread.id)}
                      className={`mb-2 w-full rounded-xl border px-3 py-2 text-left transition ${
                        active
                          ? "border-[#95b5e3] bg-[#eaf2ff]"
                          : "border-[#dce6f4] bg-white hover:bg-[#f7faff]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-[#2d4161]">
                          {thread.subject}
                        </p>
                        {thread.unreadCount > 0 && (
                          <span className="rounded-full bg-[#d6455f] px-2 py-0.5 text-[11px] font-bold text-white">
                            {thread.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-[#627b9d]">
                        {thread.convenor?.name || "Convenor"}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs text-[#577093]">
                        {thread.latestMessage?.message || "No message yet"}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide ${
                            thread.status === "RESOLVED"
                              ? "bg-[#e9f8ef] text-[#2a7b4f]"
                              : "bg-[#fff4e8] text-[#9b6328]"
                          }`}
                        >
                          {thread.status}
                        </span>
                        <span className="text-[11px] text-[#8297b2]">
                          {formatRelativeDate(thread.lastMessageAt)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </aside>

            <section className="flex min-w-0 flex-1 flex-col">
              <div className="border-b border-[#e1e8f3] px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-bold text-[#263a58]">
                      {activeThread?.subject || "Select a conversation"}
                    </h3>
                    <p className="text-xs text-[#5e7798]">
                      {activeThread?.convenor
                        ? `${activeThread.convenor.name} · ${activeThread.convenor.email}`
                        : "Open a thread from the list to reply"}
                    </p>
                  </div>
                  {activeThread && (
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        activeThread.status === "RESOLVED"
                          ? "bg-[#e9f8ef] text-[#2a7b4f]"
                          : "bg-[#fff4e8] text-[#9b6328]"
                      }`}
                    >
                      {activeThread.status}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto bg-[#fbfdff] px-4 py-3">
                {!activeThread && (
                  <p className="rounded-xl border border-dashed border-[#d4e0f0] bg-white px-4 py-3 text-sm text-[#5f789a]">
                    Pick a thread to review convenor questions and send a reply.
                  </p>
                )}

                {activeThread?.messages?.map((msg) => {
                  const isAdmin = msg.senderRole === "ADMIN";
                  return (
                    <div
                      key={msg.id}
                      className={`mb-3 flex ${isAdmin ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[78%] rounded-2xl px-3 py-2 ${
                          isAdmin
                            ? "bg-[#2f73c4] text-white"
                            : "border border-[#dce7f5] bg-white text-[#2d4262]"
                        }`}
                      >
                        <p className="text-xs font-semibold opacity-85">
                          {msg.senderName} ({msg.senderRole})
                        </p>
                        <p className="mt-1 text-sm leading-relaxed">{msg.message}</p>
                        <p className={`mt-1 text-[11px] ${isAdmin ? "text-[#dbe9ff]" : "text-[#7a8faa]"}`}>
                          {formatRelativeDate(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <form onSubmit={submitReply} className="border-t border-[#e1e8f3] bg-white px-4 py-3">
                {supportError && (
                  <p className="mb-2 rounded-lg border border-[#f1d4d9] bg-[#fff5f7] px-3 py-2 text-sm text-[#b24e5e]">
                    {supportError}
                  </p>
                )}
                <textarea
                  value={replyText}
                  onChange={(event) => setReplyText(event.target.value)}
                  placeholder={
                    activeThreadId
                      ? "Write your response to the convenor..."
                      : "Select a thread before replying..."
                  }
                  disabled={!activeThreadId || sendingReply}
                  className="h-24 w-full resize-none rounded-xl border border-[#d5e0ef] bg-[#fbfdff] px-3 py-2 text-sm text-[#29415f] outline-none focus:border-[#8fb2df]"
                />

                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <label className="inline-flex items-center gap-2 text-sm text-[#4f6889]">
                    <input
                      type="checkbox"
                      checked={markResolved}
                      onChange={(event) => setMarkResolved(event.target.checked)}
                      disabled={!activeThreadId || sendingReply}
                    />
                    Mark thread as resolved
                  </label>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => loadThreads(activeThreadId)}
                      className="rounded-lg border border-[#d2ddee] bg-[#f5f9ff] px-3 py-2 text-sm font-semibold text-[#3e5f89]"
                    >
                      Refresh
                    </button>
                    <button
                      type="submit"
                      disabled={!activeThreadId || sendingReply || !replyText.trim()}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#2f73c4] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {sendingReply ? "Sending..." : "Send Reply"}
                    </button>
                  </div>
                </div>
              </form>
            </section>
          </div>
        </div>
      )}

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

export default AdminLayout;
