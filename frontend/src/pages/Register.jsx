import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import axios from "../api/axios";
import { useNavigate } from "react-router-dom";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState("CONVENOR");

  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const navigate = useNavigate();

  const validateEmail = (emailValue) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(emailValue);
  };

  const validatePassword = (passwordValue) => {
    const regex =
      /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
    return regex.test(passwordValue);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setEmailError("");
    setPasswordError("");

    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    if (!validatePassword(password)) {
      setPasswordError(
        "Password must be at least 8 characters long and include one uppercase letter, one number, and one special character."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      await axios.post("/auth/register", {
        name,
        email,
        password,
        role,
      });

      alert("OTP sent to your email. Please verify");
      navigate("/verify-otp", { state: { email } });
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
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
            University Portal 🚀
          </h1>
          <p className="text-lg opacity-90 leading-relaxed mb-4">
            This platform is specially designed for
            <span className="text-purple-300 font-semibold">
              {" "}
              University Students{" "}
            </span>
            and
            <span className="text-purple-300 font-semibold"> Convenors</span>.
          </p>
          <p className="text-md opacity-80">
            A tool to manage student group Git repository efficiently,
            collaborate better, and streamline project coordination.
          </p>
        </div>
      </div>

      <div className="relative z-10 w-full md:w-1/2 flex justify-center md:justify-end pr-10 md:pr-24">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md bg-white/10 backdrop-blur-2xl p-8 rounded-3xl shadow-2xl floating transition-transform duration-500 hover:scale-95"
        >
          <h2 className="text-2xl font-semibold text-white text-center mb-6">
            Get Started with tool
          </h2>

          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

          <input
            type="text"
            placeholder="Full Name"
            className="w-full mb-4 px-4 py-3 rounded-xl bg-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div className="mb-4">
            <input
              type="text"
              placeholder="Email"
              className={`w-full px-4 py-3 rounded-xl bg-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400 transition ${
                emailError ? "ring-2 ring-red-400" : ""
              }`}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {emailError && (
              <p className="text-red-400 text-xs mt-1">{emailError}</p>
            )}
          </div>

          <div className="mb-4">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className={`w-full px-4 py-3 pr-12 rounded-xl bg-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400 transition ${
                  passwordError ? "ring-2 ring-red-400" : ""
                }`}
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
            {passwordError && (
              <p className="text-red-400 text-xs mt-1">{passwordError}</p>
            )}
          </div>

          <div className="relative mb-4">
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm Password"
              className="w-full px-4 py-3 pr-12 rounded-xl bg-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="absolute inset-y-0 right-3 flex items-center text-gray-300 hover:text-white transition"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              aria-label={
                showConfirmPassword
                  ? "Hide confirm password"
                  : "Show confirm password"
              }
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <select
            className="w-full mb-6 px-4 py-3 rounded-xl bg-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
            onChange={(e) => setRole(e.target.value)}
            value={role}
          >
            <option value="CONVENOR" className="text-black">
              Convenor
            </option>
            <option value="STUDENT" className="text-black">
              Student
            </option>
          </select>

          <button
            type="submit"
            className="w-full py-2 text-lg text-white rounded-xl font-semibold bg-gradient-to-r from-teal-400 to-blue-500 hover:opacity-90 transition duration-300 shadow-lg" 
          >
            Create Account
          </button>

          <p className="text-sm text-gray-200 mt-5 text-center">
            Already have an account?{" "}
            <span
              onClick={() => navigate("/login")}
              className="text-purple-300 font-medium cursor-pointer hover:underline"
            >
              Login
            </span>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Register;
