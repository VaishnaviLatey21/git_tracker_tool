import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/axios";

function Navbar({ theme, setTheme }) {
    const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef();

  useEffect(() => {
    const fetchUser = async () => {
      const res = await axios.get("/auth/me");
      setUser(res.data);
    };
    fetchUser();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (!dropdownRef.current?.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

   const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const getInitial = () =>
    user?.name ? user.name.charAt(0).toUpperCase() : "U";

return (
  <>
    {/* NAVBAR */}
    <div className="w-full bg-slate-900 text-white px-8 py-4 flex justify-between items-center shadow-lg">

      <div className="max-w-7xl w-full mx-auto flex justify-between items-center">

        {/* LEFT */}
        <div
          onClick={() => navigate("/convenor")}
          className="flex items-center gap-3 cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
            GA
          </div>
          <span className="font-semibold text-lg">
            Git Analytics
          </span>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-5">

          {/* THEME TOGGLE */}
          <button
            onClick={toggleTheme}
                          className="px-3 py-1 rounded-lg text-sm bg-slate-200 dark:bg-slate-700 dark:text-white transition"

          >
            {theme === "dark" ? "☀ Light" : "🌙 Dark"}
          </button>

          {/* PROFILE DROPDOWN */}
          <div className="relative" ref={dropdownRef}>
            <div
              onClick={() => setOpen(!open)}
              className="flex items-center gap-3 cursor-pointer"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center text-white font-semibold">
                {getInitial()}
              </div>
              <span className="hidden md:block text-gray-300">
                {user?.name}
              </span>
            </div>

            {open && (
              <div className="absolute right-0 mt-3 w-48 bg-slate-800 rounded-xl shadow-xl border border-slate-700 overflow-hidden">

                <button
                  onClick={() => {
                    setShowProfile(true);
                    setOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-700 transition"
                >
                  Profile
                </button>

                <button
                  onClick={() => {
                    alert("Contact support@yourapp.com");
                    setOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-700 transition"
                >
                  Help
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-red-400 hover:bg-red-900/40 transition"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

    {/* PROFILE MODAL */}
    {showProfile && (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">

        <div className="bg-slate-900 text-white rounded-2xl shadow-2xl p-8 w-[400px] relative border border-slate-700">

          <button
            onClick={() => setShowProfile(false)}
            className="absolute top-3 right-4 text-gray-400 hover:text-white"
          >
            ✕
          </button>

          <h2 className="text-xl font-semibold mb-6">
            Profile Details
          </h2>

          <div className="space-y-3 text-sm text-gray-300">
            <p><strong>Name:</strong> {user?.name}</p>
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>Role:</strong> {user?.role}</p>
            <p>
              <strong>Account Created:</strong>{" "}
              {user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString()
                : ""}
            </p>
          </div>

        </div>
      </div>
    )}
  </>
);
}

export default Navbar;
