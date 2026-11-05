import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "@/store/auth.store";
import { apiClient } from "@/lib/api";
import axios from "axios";

interface LoginResponse {
  data: {
    token: string;
    user: {
      id: string;
      loginId: string;
      firstName: string;
      lastName: string;
      role: "Student" | "Instructor" | "TA" | "Designer" | "Auditor" | "SystemAdmin";
      contextShellId?: string;
    };
  };
}

export function LoginPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);

  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!loginId.trim() || !password.trim()) {
      setError("Both fields are required.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await apiClient.post<LoginResponse>("/auth/login", { loginId, password });
      const { token, user } = res.data.data;
      setSession(token, {
        id: user.id,
        loginId: user.loginId,
        orgDefinedId: "",
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        contextShellId: user.contextShellId,
      });
      navigate({ to: "/dashboard" });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setError("Invalid credentials. Please try again.");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="flex min-h-screen"
      style={{ background: "var(--bg-canvas, #f6f2ec)" }}
    >
      {/* ── Left panel: institutional identity ─────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-5/12 xl:w-1/2 flex-col justify-between p-12"
        style={{ background: "var(--navy-900, #0f1c3a)" }}
      >
        {/* Crest + wordmark */}
        <div className="flex items-center gap-3">
          <svg
            aria-hidden="true"
            width="40"
            height="40"
            viewBox="0 0 44 44"
            fill="none"
          >
            <polygon
              points="22,2 40,12 40,32 22,42 4,32 4,12"
              fill="none"
              stroke="#b8922a"
              strokeWidth="1.5"
            />
            <polygon
              points="22,7 35,14.5 35,29.5 22,37 9,29.5 9,14.5"
              fill="none"
              stroke="#b8922a"
              strokeWidth="0.75"
              opacity="0.55"
            />
            <text
              x="22" y="27"
              textAnchor="middle"
              fontSize="12"
              fontFamily="'Playfair Display', Georgia, serif"
              fill="#d4a843"
            >
              Ω
            </text>
          </svg>
          <div className="leading-tight">
            <p
              className="text-base font-normal text-white"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              AtlasLMS
            </p>
            <p
              className="text-[10px] font-medium uppercase tracking-[0.18em]"
              style={{ color: "var(--gold-400, #d4a843)", fontFamily: "'Inter', system-ui, sans-serif" }}
            >
              OAU eLearning
            </p>
          </div>
        </div>

        {/* Central statement */}
        <div>
          <div
            className="w-10 mb-6"
            style={{ height: "2px", background: "var(--gold-500, #b8922a)" }}
            aria-hidden="true"
          />
          <h2
            className="leading-snug mb-4"
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              letterSpacing: "-0.02em",
              fontSize: "var(--t-h2)",
            }}
          >
            Learning management
            <br />
            for Obafemi Awolowo
            <br />
            University
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: "var(--navy-200, #c2cedf)" }}>
            Courses, grades and enrolments for students
            and instructors across OAU's faculties.
          </p>
        </div>

        {/* Footer note */}
        <p className="text-xs" style={{ color: "var(--navy-200, #c2cedf)", opacity: 0.6 }}>
          Obafemi Awolowo University, Ile-Ife
        </p>
      </div>

      {/* ── Right panel: login form ─────────────────────────────────────────── */}
      <div className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">

          {/* Mobile-only mark */}
          <div className="flex lg:hidden items-center gap-2.5 mb-10">
            <svg aria-hidden="true" width="32" height="32" viewBox="0 0 44 44" fill="none">
              <polygon points="22,2 40,12 40,32 22,42 4,32 4,12" fill="#0f1c3a" stroke="#b8922a" strokeWidth="1.5" />
              <text x="22" y="27" textAnchor="middle" fontSize="12" fontFamily="'Playfair Display', Georgia, serif" fill="#d4a843">Ω</text>
            </svg>
            <span
              className="text-base font-normal"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "var(--ink)" }}
            >
              AtlasLMS
            </span>
          </div>

          {/* Heading */}
          <h1
            className="text-3xl font-normal mb-1"
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              color: "var(--ink)",
              letterSpacing: "-0.02em",
            }}
          >
            Sign in
          </h1>
          <p className="text-sm mb-8" style={{ color: "var(--ink-muted)" }}>
            Use your OAU MyID credentials
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-5">

            <div className="field">
              <label htmlFor="loginId" className="field-label">
                Username / MyID
              </label>
              <input
                id="loginId"
                type="text"
                className="field-input"
                placeholder="e.g. prof_adebayo"
                autoComplete="username"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="password" className="field-label">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="field-input"
                placeholder="••••••••"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <p role="alert" className="alert alert-error text-xs">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full"
              style={{ height: "44px", fontSize: "15px" }}
            >
              {loading ? (
                <span className="spinner-ring" style={{ width: 18, height: 18, borderWidth: 2 }} />
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          {/* LTI entry */}
          <p className="mt-8 text-center text-sm" style={{ color: "var(--stone-500)" }}>
            Accessing via Canvas or Moodle?{" "}
            <a
              href="/lti/login"
              className="font-medium"
              style={{ color: "var(--accent)" }}
            >
              LTI 1.3 launch
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
