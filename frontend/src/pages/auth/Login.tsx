import { useState } from "react";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
  User,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../../services/api";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const handleLogin = async (
    event: React.FormEvent,
  ) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await login({
        email,
        password,
      });

      localStorage.setItem(
        "certichain_token",
        response.token,
      );

      localStorage.setItem(
        "certichain_role",
        response.role,
      );

      localStorage.setItem(
        "certichain_user",
        JSON.stringify(response),
      );

      if (response.role === "ADMIN") {
        navigate("/admin/dashboard");
      } else {
        navigate("/student/dashboard");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Login failed. Please check your credentials.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-screen flex items-center justify-center bg-[#f8fbff] px-6">

      <div className="pointer-events-none absolute left-0 top-0 h-72 w-72 rounded-full bg-[#BDDDFC]/30 blur-3xl" />

      <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[#88BDF2]/20 blur-3xl" />

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl lg:grid-cols-2">

        {/* Branding */}
        <div className="hidden bg-[#384959] p-10 text-white lg:flex lg:flex-col lg:justify-between">

          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
                <ShieldCheck className="h-6 w-6 text-white" />
              </div>

              <div>
                <h1 className="text-xl font-bold">
                  CertiChain
                </h1>

                <p className="text-xs text-[#BDDDFC]">
                  Certificate Verification
                </p>
              </div>
            </div>

            <div className="mt-16">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#88BDF2]">
                Secure Access
              </p>

              <h2 className="mt-4 text-4xl font-bold leading-tight">
                Manage certificates
                <span className="block text-[#88BDF2]">
                  with confidence.
                </span>
              </h2>

              <p className="mt-6 max-w-md leading-7 text-slate-300">
                Access the CertiChain administration
                and student portals securely.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm text-slate-300">
            <LockKeyhole className="h-4 w-4 text-[#88BDF2]" />
            Secure JWT authentication
          </div>
        </div>

        {/* Form */}
        <div className="p-8 sm:p-10 lg:p-12">

          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium hover:opacity-70"
            style={{ color: "#6A89A7" }}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>

          <div className="mt-8">
            <h2 className="text-3xl font-bold text-[#384959]">
              Welcome back
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Sign in to your CertiChain account.
            </p>
          </div>

          {error && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form
            onSubmit={handleLogin}
            className="mt-7 space-y-5"
          >

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-[#384959]"
              >
                Email Address
              </label>

              <div className="relative">
                <User className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="admin@college.edu"
                  required
                  className="w-full rounded-xl border border-slate-300 py-3.5 pl-12 pr-4 text-sm text-[#384959] outline-none focus:border-[#6A89A7] focus:ring-4 focus:ring-[#BDDDFC]/40"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-[#384959]"
              >
                Password
              </label>

              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                <input
                  id="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Enter your password"
                  required
                  className="w-full rounded-xl border border-slate-300 py-3.5 pl-12 pr-12 text-sm text-[#384959] outline-none focus:border-[#6A89A7] focus:ring-4 focus:ring-[#BDDDFC]/40"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (current) => !current,
                    )
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#384959]"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#384959] px-5 py-3.5 font-semibold transition hover:bg-[#2f3e4c] disabled:cursor-not-allowed disabled:opacity-70"
              style={{ color: "#ffffff" }}
            >
              <LockKeyhole className="h-5 w-5" />

              {loading
                ? "Signing in..."
                : "Sign In"}
            </button>
          </form>

          <div className="mt-6 rounded-xl border border-[#BDDDFC] bg-[#BDDDFC]/20 p-4">
            <p className="text-xs font-semibold text-[#384959]">
              Secure Authentication
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Your credentials are authenticated by the
              CertiChain Spring Boot backend and a JWT
              token is issued upon successful login.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}