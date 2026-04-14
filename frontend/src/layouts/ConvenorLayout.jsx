import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  BookOpenText,
  CircleHelp,
  LayoutDashboard,
  Layers3,
  LogOut,
  Menu,
  MessageSquareDot,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import axios from "../api/axios";

const navItems = [
  { label: "Overview", to: "/convenor", icon: LayoutDashboard },
  { label: "Modules", to: "/convenor/modules", icon: Layers3 },
  { label: "Groups", to: "/convenor/modules", icon: UsersRound },
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
              Add a repository URL when creating/editing groups, or use Link Repo actions.
            </p>
          </article>
          <article className="rounded-xl border border-[#e2e9f4] bg-[#f9fbfe] p-3">
            <h3 className="font-semibold text-[#2a3c58]">Where can I export reports?</h3>
            <p className="mt-1">
              Open any group summary and use the Export CSV/PDF buttons.
            </p>
          </article>
        </div>
      </div>
    </div>
  );
}

function ProfileModal({ user, onClose }) {
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
            <span className="font-semibold text-[#2a3c58]">Name:</span>{" "}
            {user?.name || "N/A"}
          </p>
          <p>
            <span className="font-semibold text-[#2a3c58]">Email:</span>{" "}
            {user?.email || "N/A"}
          </p>
          <p>
            <span className="font-semibold text-[#2a3c58]">Role:</span>{" "}
            {user?.role || "CONVENOR"}
          </p>
        </div>
      </div>
    </div>
  );
}

function ConvenorLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);

  const menuRef = useRef(null);

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
    const onMouseDown = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  const breadcrumb = useMemo(() => {
    if (location.pathname === "/convenor") return "Convenor / Analytics Overview";
    if (location.pathname === "/convenor/modules")
      return "Convenor / Module Configuration";
    if (location.pathname.startsWith("/convenor/modules/"))
      return "Convenor / Group Management";
    if (location.pathname.startsWith("/convenor/groups/"))
      return "Convenor / Group Report";
    return "Convenor Dashboard";
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const avatar = user?.name?.charAt(0)?.toUpperCase() || "C";

  return (
    <div className="min-h-screen bg-[#f3f7fc]">
      <div className="mx-auto flex max-w-[1600px] gap-0">
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-[260px] border-r border-[#22395f] bg-[#0f213f] text-white transition-transform duration-300 md:static md:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
        >
          <div className="flex h-full flex-col">
            <div className="border-b border-white/10 px-6 py-6">
              <p className="flex items-center gap-3 text-xl font-bold tracking-tight">
                <BookOpenText className="h-6 w-6 text-[#8dc4ff]" />
                Git Tracker
              </p>
              <p className="mt-1 text-xs text-[#a6bddf]">Convenor Dashboard</p>
            </div>

            <nav className="flex-1 space-y-1 px-3 py-5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active =
                  location.pathname === item.to ||
                  (item.to !== "/convenor" &&
                    location.pathname.startsWith(item.to));

                return (
                  <NavLink
                    key={item.label}
                    to={item.to}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${active
                        ? "bg-[#244a7a] text-white"
                        : "text-[#c9d7ee] hover:bg-white/10 hover:text-white"
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

        <div className="min-h-screen flex-1">
          <header className="sticky top-0 z-30 border-b border-[#dde5f1] bg-white/92 px-4 py-3 backdrop-blur md:px-7">
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
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 text-white text-sm font-bold shadow-md">
                    {avatar}
                  </div>

                  <p className="text-lg font-semibold text-[#26374f]">
                    Welcome back, {user?.name || "Convenor"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-lg border border-[#dce5f2] bg-white p-2 text-[#627795] hover:bg-[#f5f8fc]"
                >
                  <Bell className="h-4 w-4" />
                </button>
                <button
                  type="button"
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
                    <span className="hidden text-sm font-semibold text-[#344a68] md:inline">
                      {user?.name || "Convenor"}
                    </span>
                  </button>

                  {menuOpen && (
                    <div className="absolute right-0 top-11 z-50 w-52 overflow-hidden rounded-xl border border-[#d6deea] bg-white shadow-lg">
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

          <main className="p-4 md:p-7">
            <Outlet context={{ user }} />
          </main>
        </div>
      </div>

      {showProfile && <ProfileModal user={user} onClose={() => setShowProfile(false)} />}
      {showFAQ && <FAQModal onClose={() => setShowFAQ(false)} />}

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
