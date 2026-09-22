
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiUser,
  FiMail,
  FiLock,
  FiPhone,
  FiEye,
  FiEyeOff,
  FiAlertCircle,
  FiCheckCircle,
} from "react-icons/fi";
import api from "../api";

function SignupPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const { name, email, password, phone } = formData;

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Name, email and password are required");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/users/signup", {
        name,
        email,
        password,
        phone,
      });

      setSuccess(
        response.data.message ||
          "Account created successfully"
      );

      setFormData({
        name: "",
        email: "",
        password: "",
        phone: "",
      });

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error) {
      console.error(
        "Signup failed:",
        error.response?.data || error.message
      );

      setError(
        error.response?.data?.message ||
          "Signup failed"
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

        {/* Decorative blobs */}
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

        {/* Middle content */}
        <div className="relative z-10 max-w-md">

          <h2 className="text-4xl font-bold leading-tight tracking-tight">
            Start managing your sales.
          </h2>

          <p className="mt-4 text-blue-100 leading-relaxed">
            Create your account and manage leads, contacts,
            deals and customers from one place.
          </p>

          <ul className="mt-8 space-y-3 text-sm text-blue-50">

            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-200"></span>
              Manage your sales pipeline
            </li>

            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-200"></span>
              Track leads and customers
            </li>

            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-200"></span>
              Organize tasks and activities
            </li>

          </ul>

        </div>

        {/* Footer */}
        <div className="relative z-10 text-xs text-blue-200">
          © {new Date().getFullYear()} Sales CRM. All rights reserved.
        </div>

      </div>

      {/* =====================================================
          RIGHT SIDE — SIGNUP FORM
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

          {/* Heading */}
          <div className="mb-8">

            <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight">
              Create your account
            </h2>

            <p className="text-sm text-gray-500 mt-2">
              Sign up to get started with Sales CRM
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
            onSubmit={handleSignup}
            className="space-y-4"
          >

            {/* NAME */}
            <div>

              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Full name
              </label>

              <div className="relative">

                <FiUser
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  size={17}
                />

                <input
                  type="text"
                  name="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  autoComplete="name"
                  className="w-full h-11 pl-11 pr-4 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
                />

              </div>

            </div>

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
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                  className="w-full h-11 pl-11 pr-4 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
                />

              </div>

            </div>

            {/* PHONE */}
            <div>

              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Phone number
              </label>

              <div className="relative">

                <FiPhone
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  size={17}
                />

                <input
                  type="tel"
                  name="phone"
                  placeholder="9876543210"
                  value={formData.phone}
                  onChange={handleChange}
                  autoComplete="tel"
                  className="w-full h-11 pl-11 pr-4 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
                />

              </div>

            </div>

            {/* PASSWORD */}
            <div>

              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>

              <div className="relative">

                <FiLock
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  size={17}
                />

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  name="password"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  className="w-full h-11 pl-11 pr-12 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? (
                    <FiEyeOff size={16} />
                  ) : (
                    <FiEye size={16} />
                  )}
                </button>

              </div>

            </div>

            {/* SIGNUP BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 mt-2 inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-lg transition shadow-sm shadow-blue-600/20 disabled:opacity-60 disabled:cursor-not-allowed"
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

                  Creating account...
                </>
              ) : (
                "Create account"
              )}

            </button>

          </form>

          {/* LOGIN LINK */}
          <div className="text-center mt-6">

            <p className="text-sm text-gray-500">
              Already have an account?{" "}
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

export default SignupPage;

