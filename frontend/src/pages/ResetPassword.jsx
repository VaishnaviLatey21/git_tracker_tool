import { useMemo, useState } from "react";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axios from "../api/axios";

function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const prefetchedEmail = useMemo(
    () => searchParams.get("email") || "",
    [searchParams]
  );

  const [email, setEmail] = useState(prefetchedEmail);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post("/auth/reset-password", {
        email,
        otp,
        newPassword,
      });
      setMessage(response.data?.message || "Password reset successful");
      setTimeout(() => navigate("/login"), 900);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1638] p-4 sm:p-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-4xl overflow-hidden rounded-[28px] border border-[#32427c] bg-gradient-to-br from-[#171f48] via-[#111b3e] to-[#0d1535] shadow-2xl shadow-black/40">
        <div className="hidden w-[46%] flex-col justify-between border-r border-[#2f3f77] p-10 text-white lg:flex">
          <div>
            <p className="flex items-center gap-3 text-2xl font-bold">
              <KeyRound className="h-7 w-7 text-[#8ad6ff]" />
              Reset Password
            </p>
            <p className="mt-3 text-sm text-[#b7c8ef]">
              Enter your OTP and set a new password for your account.
            </p>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center p-8">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-md space-y-4 rounded-2xl border border-[#3a4a83] bg-[#101a3d]/80 p-7 backdrop-blur"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8fa8d4]">
                OTP Verification
              </p>
              <h1 className="mt-1 text-3xl font-bold text-white">Set New Password</h1>
            </div>

            {error && (
              <p className="rounded-lg border border-[#7a3c53] bg-[#371728] px-3 py-2 text-sm text-[#ffc7d3]">
                {error}
              </p>
            )}
            {message && (
              <p className="rounded-lg border border-[#356a56] bg-[#183a2f] px-3 py-2 text-sm text-[#b9f3da]">
                {message}
              </p>
            )}

            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#9eb3d8]">
                Email
              </span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="w-full rounded-xl border border-[#45578e] bg-[#0e1738] px-3 py-2.5 text-white outline-none transition focus:border-[#5e7be5]"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#9eb3d8]">
                OTP
              </span>
              <input
                type="text"
                value={otp}
                onChange={(event) => setOtp(event.target.value)}
                required
                className="w-full rounded-xl border border-[#45578e] bg-[#0e1738] px-3 py-2.5 text-white outline-none transition focus:border-[#5e7be5]"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#9eb3d8]">
                New Password
              </span>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  required
                  className="w-full rounded-xl border border-[#45578e] bg-[#0e1738] px-3 py-2.5 pr-10 text-white outline-none transition focus:border-[#5e7be5]"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9ab0d6]"
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#9eb3d8]">
                Confirm New Password
              </span>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                  className="w-full rounded-xl border border-[#45578e] bg-[#0e1738] px-3 py-2.5 pr-10 text-white outline-none transition focus:border-[#5e7be5]"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9ab0d6]"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-[#4a63d2] to-[#2f9ecd] py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>

            <p className="text-center text-sm text-[#9ab0d6]">
              Back to{" "}
              <Link to="/login" className="font-semibold text-[#a7d9ff] hover:underline">
                Login
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
