
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FiMail,
  FiArrowLeft,
  FiAlertCircle,
  FiCheckCircle,
} from "react-icons/fi";
import api from "../api";

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post(
        "/users/forgot-password",
        {
          email,
        }
      );

      setSuccess(
        response.data.message ||
          "If the email exists, password reset instructions have been sent."
      );

      setEmail("");
    } catch (error) {
      console.error(
        "Forgot password failed:",
        error.response?.data || error.message
      );

      setError(
        error.response?.data?.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* =====================================================
          LEFT SIDE — BRANDING
      ===================================================== */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 text-white flex-col justify-between p-12">

        {/* Decorative background */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/10 blur-3xl"></div>

        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-purple-400/20 blur-3xl"></div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">

          <div className="flex gap-[3px]">
            <span className="w-1.5 h-6 bg-white rounded-sm"></span>
            <span className="w-1.5 h-6 bg-white rounded-sm"></span>
            <span className="w-1.5 h-6 bg-white rounded-sm"></span>
          </div>

          <h1 className="text-xl font-bold tracking-tight">
            Sales CRM
          </h1>

        </div>

        {/* Main content */}
        <div className="relative z-10 max-w-md">

          <h2 className="text-4xl font-bold leading-tight tracking-tight">
            Reset your password.
          </h2>

          <p className="mt-4 text-blue-100 leading-relaxed">
            Enter the email address associated with your account
            and we'll help you get back into your Sales CRM account.
          </p>

        </div>

        {/* Footer */}
        <div className="relative z-10 text-xs text-blue-200">
          © {new Date().getFullYear()} Sales CRM. All rights reserved.
        </div>

      </div>

      {/* =====================================================
          RIGHT SIDE — FORGOT PASSWORD FORM
      ===================================================== */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 bg-gray-50">

        <div className="w-full max-w-[400px]">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">

            <div className="flex gap-[3px]">
              <span className="w-1.5 h-6 bg-blue-600 rounded-sm"></span>
              <span className="w-1.5 h-6 bg-blue-600 rounded-sm"></span>
              <span className="w-1.5 h-6 bg-blue-600 rounded-sm"></span>
            </div>

            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              Sales CRM
            </h1>

          </div>

          {/* Back to login */}
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition mb-7"
          >
            <FiArrowLeft size={16} />
            Back to login
          </Link>

          {/* Heading */}
          <div className="mb-8">

            <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight">
              Forgot your password?
            </h2>

            <p className="text-sm text-gray-500 mt-2 leading-relaxed">
              Enter your email address and we'll send you
              instructions to reset your password.
            </p>

          </div>

          {/* ERROR */}
          {error && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-3 rounded-lg mb-6">

              <FiAlertCircle
                className="flex-shrink-0 mt-0.5"
                size={18}
              />

              <p className="flex-1">
                {error}
              </p>

            </div>
          )}

          {/* SUCCESS */}
          {success && (
            <div className="flex items-start gap-3 bg-green-50 border border-green-200 text-green-800 text-sm px-4 py-3 rounded-lg mb-6">

              <FiCheckCircle
                className="flex-shrink-0 mt-0.5"
                size={18}
              />

              <p className="flex-1">
                {success}
              </p>

            </div>
          )}

          {/* FORM */}
          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            {/* EMAIL */}
            <div>

              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email address
              </label>

              <div className="relative">

                <FiMail
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  size={17}
                />

                <input
                  type="email"
                  name="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="w-full h-11 pl-11 pr-4 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
                />

              </div>

            </div>

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-lg transition shadow-sm shadow-blue-600/20 disabled:opacity-60 disabled:cursor-not-allowed"
            >

              {loading ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>

                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    ></path>
                  </svg>

                  Sending...
                </>
              ) : (
                "Send reset instructions"
              )}

            </button>

          </form>

          {/* LOGIN LINK */}
          <div className="text-center mt-6">

            <p className="text-sm text-gray-500">
              Remember your password?{" "}
              <Link
                to="/login"
                className="font-semibold text-blue-600 hover:text-blue-700 transition"
              >
                Sign in
              </Link>
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}

export default ForgotPasswordPage;

