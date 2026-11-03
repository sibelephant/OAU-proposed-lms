import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "@/store/auth.store";
import type { UserRole } from "@/store/auth.store";
import { Spinner } from "@/components/ui/spinner";

/**
 * Landing page after a successful LTI 1.3 launch.
 *
 * The API's POST /lti/launch returns a JSON response with { data: { token, user } }.
 * In a real iframe-based LTI deployment the server would redirect here with the token
 * as a URL fragment or a short-lived code; for now we read it from the query string
 * so the flow is demonstrable without a full LTI platform.
 *
 * URL shape: /lti-launch#token=<jwt>&role=<role>&shellId=<uuid>
 */
export function LtiLaunchPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const token = params.get("token");
    const role = params.get("role");
    const shellId = params.get("shellId");
    const loginId = params.get("loginId");
    const firstName = params.get("firstName");
    const lastName = params.get("lastName");
    const sub = params.get("sub");
    const orgDefinedId = params.get("orgDefinedId");

    if (!token || !sub) {
      // Nothing useful — send to login
      navigate({ to: "/login" });
      return;
    }

    setSession(token, {
      id: sub,
      loginId: loginId ?? sub,
      orgDefinedId: orgDefinedId ?? "",
      firstName: firstName ?? "OAU",
      lastName: lastName ?? "User",
      role: (role as UserRole | null) ?? "Student",
      contextShellId: shellId ?? undefined,
      ltiLaunch: true,
    });

    // Remove credentials from the address bar and browser history after reading them.
    window.history.replaceState(
      null,
      "",
      window.location.pathname + window.location.search,
    );

    // Deep-link: if we have a shell context go straight to it
    if (shellId) {
      navigate({ to: "/courses/$shellId", params: { shellId } });
    } else {
      navigate({ to: "/dashboard" });
    }
  }, [navigate, setSession]);

  return (
    <div className="min-h-screen flex min-h-screen items-center justify-center bg-gradient-to-b from-brand-950 to-slate-50">
      <div className="flex flex-col items-center gap-4 text-slate-950">
        <Spinner size="lg" className="text-brand-600" />
        <p className="text-sm font-medium">Completing LTI launch…</p>
      </div>
    </div>
  );
}