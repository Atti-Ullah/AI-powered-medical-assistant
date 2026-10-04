"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../contexts/AuthContext";

// Landing page after Google/GitHub sign-in: reads the session from the URL fragment,
// signs the user in and removes it from the address bar.
export default function OAuthCallbackPage() {
  const router = useRouter();
  const { login } = useAuth();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    try {
      const params = new URLSearchParams(window.location.hash.slice(1));
      const encoded = params.get("session");
      window.history.replaceState(null, "", window.location.pathname);

      if (!encoded) throw new Error("Missing session");

      const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
      const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      const session = JSON.parse(new TextDecoder().decode(bytes));

      if (login(session) === false) throw new Error("Login rejected");
    } catch (error) {
      console.error("OAuth sign-in failed:", error);
      router.replace("/login?error=oauth_failed");
    }
  }, [login, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="flex items-center gap-3 text-sm text-gray-600" role="status">
        <svg className="h-5 w-5 animate-spin text-primary-600" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
        Signing you in...
      </div>
    </div>
  );
}
