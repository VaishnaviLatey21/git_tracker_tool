import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "../api/axios";

function VerifyOTP() {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  const handleVerify = async (e) => {
    e.preventDefault();

    // Check 6-digit OTP
    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await axios.post("/auth/verify-otp", {
        email,
        otp,
      });

      if (res.status === 200) {
        alert("Email verified successfully!");
        navigate("/login");
      }
    } catch (err) {
      const message = err.response?.data?.message;

      if (message === "Invalid OTP" || message === "OTP expired") {
        setError("Invalid or expired OTP");
      } else if (message === "Invalid request") {
        setError("Incorrect OTP, please enter the correct otp");
      } else {
        setError("Something went wrong. Try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleVerify}
        className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md space-y-5"
      >
        <h2 className="text-2xl font-bold text-center">
          Verify Your Email
        </h2>

        <p className="text-sm text-gray-600 text-center">
          Please enter the 6-digit OTP sent to your email address.
        </p>

        {/* Error Message */}
        {error && (
          <p className="text-red-500 text-sm text-center font-medium">
            {error}
          </p>
        )}

        <input
          type="text"
          placeholder="Enter OTP"
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center tracking-widest"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
          maxLength={6}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 rounded-lg font-semibold transition duration-300 ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700 text-white"
          }`}
        >
          {loading ? "Verifying..." : "Verify OTP"}
        </button>
      </form>
    </div>
  );
}

export default VerifyOTP;
