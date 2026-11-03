import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "@/store/auth.store";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardBody } from "@/components/ui/card";
import { OauBadge } from "@/components/branding/OauBadge";
import axios from "axios";

interface LoginResponse {
  data: {
    token: string;
    user: {
      id: string;
      loginId: string;
      firstName: string;
      lastName: string;
      role:
        | "Student"
        | "Instructor"
        | "TA"
        | "Designer"
        | "Auditor"
        | "SystemAdmin";
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
      // Direct credential login — hits POST /api/v1/auth/login
      // (a thin endpoint that issues a JWT for dev/admin use)
      const res = await apiClient.post<LoginResponse>("/auth/login", {
        loginId,
        password,
      });
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
    <div className="min-h-screen bg-slate-50">
      {/* OAU Banner */}
      <header className="border-b border-slate-200 bg-gradient-to-b from-brand-600 to-brand-800 p-6">
        <div className="max-w-2xl mx-auto text-center">
          <OauBadge className="justify-center" />
          <h1 className="text-2xl font-bold text-white">AtlasLMS</h1>
          <p className="mt-1 text-sm text-slate-200">Sign in to your account</p>
        </div>
      </header>

      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-sm space-y-6">
          {/* Brand mark */}
          <div className="text-center mb-6">
            <OauBadge className="justify-center" />
            <h1 className="mt-3 text-2xl font-bold text-slate-900">AtlasLMS</h1>
            <p className="mt-1 text-sm text-slate-500">
              Sign in to your account
            </p>
          </div>

          <Card>
            <CardBody className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <Input
                  id="loginId"
                  label="Username / MyID"
                  placeholder="e.g. prof_adebayo"
                  autoComplete="username"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                />
                <Input
                  id="password"
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                {error && (
                  <p
                    role="alert"
                    className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700"
                  >
                    {error}
                  </p>
                )}

                <Button type="submit" loading={loading} className="w-full">
                  Sign in
                </Button>
              </form>
            </CardBody>
          </Card>

          {/* LTI entry point notice */}
          <p className="mt-4 text-center text-sm text-slate-400">
            Accessing via Canvas / Moodle?{" "}
            <a href="/lti/login" className="text-brand-600 hover:underline">
              LTI 1.3 Launch
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
