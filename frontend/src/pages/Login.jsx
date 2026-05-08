import { useState, useContext } from "react";
import { Eye, EyeOff } from "lucide-react";
import axios from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await axios.post("/auth/login", { email, password });
      login(res.data);

      if (res.data.user.role === "ADMIN") navigate("/admin");
      else if (res.data.user.role === "CONVENOR") navigate("/convenor");
      else navigate("/student");
    } catch (err) {
      setError("Login failed. Please check your credentials.");
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-end overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f')",
        }}
      ></div>

      <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/60 to-indigo-900/60 backdrop-blur-sm"></div>

      <div className="absolute inset-0 overflow-hidden z-0">
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
      </div>
      
      <div className="relative z-10 w-1/2 hidden md:flex flex-col justify-center pl-24 text-white">
        <div className="max-w-xl">
          <h1 className="text-4xl font-bold mb-6 leading-tight">
            Welcome Back 👋
          </h1>
          <p className="text-lg opacity-90 leading-relaxed mb-4">
            Access your University Git Repository Management Tool.
          </p>
          <p className="text-md opacity-80">
            Collaborate, manage student group repositories, and streamline
            project coordination efficiently.
          </p>
        </div>
      </div>

      <div className="relative z-10 w-full md:w-1/2 flex justify-center md:justify-end pr-10 md:pr-24">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md bg-white/10 backdrop-blur-2xl p-8 rounded-3xl shadow-2xl floating transition-transform duration-500 hover:scale-95"
        >
          <h2 className="text-2xl font-semibold text-white text-center mb-6">
            Sign In
          </h2>

          {error && (
            <p className="text-red-400 text-sm mb-4 text-center">{error}</p>
          )}

          <input
            type="email"
            placeholder="Email"
            className="w-full mb-4 px-4 py-3 rounded-xl bg-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div className="relative mb-6">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="w-full px-4 py-3 pr-12 rounded-xl bg-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="absolute inset-y-0 right-3 flex items-center text-gray-300 hover:text-white transition"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="mb-5 text-right">
            <span
              onClick={() => navigate("/forgot-password")}
              className="cursor-pointer text-sm text-teal-200 hover:underline"
            >
              Forgot password?
            </span>
          </div>

          <button
            type="submit"
            className="w-full py-2 text-lg text-white rounded-xl font-semibold bg-gradient-to-r from-teal-400 to-blue-500 hover:opacity-90 transition duration-300 shadow-lg" >
            Login
          </button>

          <p className="text-sm text-gray-200 mt-5 text-center">
            Don't have an account?{" "}
            <span
              onClick={() => navigate("/register")}
              className="text-purple-300 font-medium cursor-pointer hover:underline"
            >
              Register
            </span>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Login;
