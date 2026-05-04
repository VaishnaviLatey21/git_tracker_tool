import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  Bell,
  LogOut,
  Menu,
  ShieldCheck,
  UserCog,
  Users,
  X,
} from "lucide-react";
import axios from "../api/axios";

const navItems = [
  { label: "Overview", to: "/admin", icon: Activity },
  { label: "Users", to: "/admin/users", icon: Users },
  { label: "Roles", to: "/admin/roles", icon: UserCog },
];

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const sectionLabel = useMemo(() => {
    if (location.pathname === "/admin") return "System-Wide Analytics";
    if (location.pathname.startsWith("/admin/users")) return "User Management";
    if (location.pathname.startsWith("/admin/roles")) return "Role Management";
    return "Admin Dashboard";
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/admin/login");
  };

  const avatar = user?.name?.charAt(0)?.toUpperCase() || "A";

  return (
    <div className="min-h-screen bg-[#f4f6fb]">
      <div className="mx-auto flex max-w-[1700px]">
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-[270px] border-r border-[#2b1f6d] bg-gradient-to-b from-[#1b1650] via-[#1a2558] to-[#13284b] text-white transition-transform duration-300 md:static md:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex h-full flex-col">
            <div className="border-b border-white/10 px-6 py-6">
              <p className="flex items-center gap-3 text-xl font-bold tracking-tight">
                <ShieldCheck className="h-6 w-6 text-[#92d6ff]" />
                Admin Console
              </p>
              <p className="mt-1 text-xs text-[#bad2ff]">
                Governance & System Control
              </p>
            </div>

            <nav className="flex-1 space-y-1 px-3 py-5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active =
                  location.pathname === item.to ||
                  (item.to !== "/admin" && location.pathname.startsWith(item.to));

                return (
                  <NavLink
                    key={item.label}
                    to={item.to}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                      active
                        ? "bg-[#4a63d2] text-white shadow-lg shadow-[#304ab4]/40"
                        : "text-[#d8e4ff] hover:bg-white/10 hover:text-white"
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

        <div className="min-h-screen flex-1">
          <header className="sticky top-0 z-30 border-b border-[#dee4f0] bg-white/95 px-4 py-3 backdrop-blur md:px-7">
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
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-[#4a63d2] to-[#29a6d4] text-sm font-bold text-white shadow-md">
                    {avatar}
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-[#28354a]">
                      Welcome, {user?.name || "Administrator"}
                    </p>
                    <p className="text-xs font-medium uppercase tracking-wider text-[#7288a7]">
                      {sectionLabel}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-lg border border-[#dce5f2] bg-white p-2 text-[#627795] hover:bg-[#f5f8fc]"
                >
                  <Bell className="h-4 w-4" />
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
                    <span className="hidden text-sm font-semibold text-[#344a68] md:inline">
                      {user?.role || "ADMIN"}
                    </span>
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

          <main className="p-4 md:p-7">
            <Outlet context={{ user }} />
          </main>
        </div>
      </div>

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
