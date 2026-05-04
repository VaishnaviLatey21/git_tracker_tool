import { useContext, useState } from "react";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import axios from "../../api/axios";
import { AuthContext } from "../../context/AuthContext";

function AdminLogin() {
  const navigate = useNavigate();
  const { login, logout } = useContext(AuthContext);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    try {
      const response = await axios.post("/auth/login", { email, password });
      const userRole = response.data?.user?.role;

      if (userRole !== "ADMIN") {
        logout();
        setError("This portal is for admin access only.");
        return;
      }

      login(response.data);
      navigate("/admin");
    } catch (err) {
      setError(err.response?.data?.message || "Admin login failed.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1638] p-4 sm:p-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-5xl overflow-hidden rounded-[28px] border border-[#32427c] bg-gradient-to-br from-[#171f48] via-[#111b3e] to-[#0d1535] shadow-2xl shadow-black/40">
        <div className="hidden w-[48%] flex-col justify-between border-r border-[#2f3f77] p-10 text-white lg:flex">
          <div>
            <p className="flex items-center gap-3 text-2xl font-bold">
              <ShieldCheck className="h-7 w-7 text-[#8ad6ff]" />
              Admin Console
            </p>
            <p className="mt-3 text-sm text-[#b7c8ef]">
              Centralized user governance, role control, and system analytics.
            </p>
          </div>

          <div className="space-y-3 text-sm text-[#c6d4f4]">
            <p>1. Monitor platform usage and commit volume.</p>
            <p>2. Manage user roles and access boundaries.</p>
            <p>3. Keep governance auditable and controlled.</p>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center p-8">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-md space-y-4 rounded-2xl border border-[#3a4a83] bg-[#101a3d]/80 p-7 backdrop-blur"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8fa8d4]">
                Secure Admin Access
              </p>
              <h1 className="mt-1 text-3xl font-bold text-white">Admin Login</h1>
            </div>

            {error && (
              <p className="rounded-lg border border-[#7a3c53] bg-[#371728] px-3 py-2 text-sm text-[#ffc7d3]">
                {error}
              </p>
            )}

            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#9eb3d8]">
                Email
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl border border-[#45578e] bg-[#0e1738] px-3 py-2.5 text-white outline-none transition focus:border-[#5e7be5]"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#9eb3d8]">
                Password
              </span>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-xl border border-[#45578e] bg-[#0e1738] px-3 py-2.5 pr-10 text-white outline-none transition focus:border-[#5e7be5]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9ab0d6]"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>

            <button
              type="submit"
              className="w-full rounded-xl bg-gradient-to-r from-[#4a63d2] to-[#2f9ecd] py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Login to Admin Dashboard
            </button>

            <p className="text-center text-sm text-[#9ab0d6]">
              Need an admin account?{" "}
              <Link to="/admin/register" className="font-semibold text-[#a7d9ff] hover:underline">
                Register Admin
              </Link>
            </p>

            <p className="text-center text-xs text-[#7f97c2]">
              Standard user login:{" "}
              <Link to="/login" className="font-semibold text-[#a9c7ff] hover:underline">
                Go to Login
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
