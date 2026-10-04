"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  EnvelopeIcon,
  ExclamationCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../contexts/AuthContext";

// Messages for errors sent back from the Google/GitHub sign-in flow (?error=...)
const OAUTH_ERRORS = {
  oauth_not_configured: "This sign-in method isn't available yet. Please use your email and password.",
  oauth_unknown_provider: "That sign-in method isn't supported.",
  oauth_cancelled: "Sign-in was cancelled. You can try again or use your email and password.",
  oauth_failed: "We couldn't sign you in with that account. Please try again.",
  oauth_unverified_email: "Your account's email address isn't verified, so we can't use it to sign in.",
  oauth_patient_only: "Doctor and admin accounts must sign in with their email and password.",
  oauth_suspended: "This account has been suspended. Please contact an administrator.",
};

const roles = [
  { value: "patient", label: "Patient" },
  { value: "doctor", label: "Doctor" },
  { value: "admin", label: "Admin" },
];

export default function LoginForm() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState("patient");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Show the reason when returning from a failed Google/GitHub sign-in
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("error");
    if (code && OAUTH_ERRORS[code]) {
      setError(OAUTH_ERRORS[code]);
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Use the new API endpoint path
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          userType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      // Check if user data already exists in localStorage to preserve profile data
      const existingUserData = localStorage.getItem("medisynix_user");
      let savedUserData = null;

      if (existingUserData) {
        try {
          const parsedData = JSON.parse(existingUserData);
          // If this is the same user (by email and type), preserve their data
          if (
            parsedData.email === data.data.email &&
            parsedData.type === data.data.type
          ) {
            savedUserData = parsedData;
          }
        } catch (e) {
          console.error("Error parsing existing user data", e);
        }
      }

      // Create user data object, preserving existing data if available
      const userData = {
        id: data.data.id,
        email: data.data.email,
        name: data.data.name || savedUserData?.name || "",
        type: data.data.type,
        token: data.data.token,
        // Preserve health metrics and profile data
        bloodPressure: savedUserData?.bloodPressure || "",
        heartRate: savedUserData?.heartRate || "",
        glucoseLevel: savedUserData?.glucoseLevel || "",
        height: savedUserData?.height || "",
        weight: savedUserData?.weight || "",
        lastMetricsUpdate: savedUserData?.lastMetricsUpdate || "",
        dateOfBirth: data.data.dateOfBirth || savedUserData?.dateOfBirth || "",
        gender: data.data.gender || savedUserData?.gender || "",
        bloodType: data.data.bloodType || savedUserData?.bloodType || "",
        allergies: data.data.allergies || savedUserData?.allergies || "",
        medicalConditions: data.data.medicalConditions || savedUserData?.medicalConditions || "",
        medications: data.data.medications || savedUserData?.medications || "",
        phone: data.data.phone || savedUserData?.phone || "",
        // Preserve appointments if they exist
        appointments: savedUserData?.appointments || [],
        // Preserve reports if they exist
        reports: savedUserData?.reports || [],
      };

      // Login the user with the combined data
      login(userData);
    } catch (err) {
      setError(
        err.message || "Failed to login. Please check your credentials."
      );
      setLoading(false);
    }
  };

  const inputClass =
    "block w-full rounded-lg border-0 bg-white py-2.5 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 transition placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600";

  return (
    <div className="flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-12">
      <div>
        <h1 className="text-[1.75rem] font-bold leading-tight tracking-tight text-gray-900">
          Welcome back
        </h1>
        <p className="mt-2 text-sm leading-6 text-gray-600">
          Sign in to continue to your Medisynix account.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-6 flex items-start gap-3 rounded-lg bg-red-50 p-3.5 ring-1 ring-inset ring-red-200"
        >
          <ExclamationCircleIcon
            className="mt-0.5 h-5 w-5 shrink-0 text-red-500"
            aria-hidden="true"
          />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
        <fieldset>
          <legend className="block text-sm font-medium leading-6 text-gray-900">
            I am signing in as
          </legend>
          <div className="mt-2 grid grid-cols-3 gap-1 rounded-xl bg-gray-100 p-1">
            {roles.map((role) => (
              <label key={role.value} className="cursor-pointer">
                <input
                  type="radio"
                  name="user-type"
                  value={role.value}
                  checked={userType === role.value}
                  onChange={(e) => setUserType(e.target.value)}
                  className="peer sr-only"
                />
                <span className="block rounded-lg px-3 py-2 text-center text-sm font-medium text-gray-600 transition hover:text-gray-900 peer-checked:bg-white peer-checked:text-primary-700 peer-checked:shadow-sm peer-focus-visible:ring-2 peer-focus-visible:ring-primary-600">
                  {role.label}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium leading-6 text-gray-900"
          >
            Email address
          </label>
          <div className="relative mt-2">
            <EnvelopeIcon
              className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
              aria-hidden="true"
            />
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`${inputClass} pl-10 pr-3`}
              placeholder="you@example.com"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="block text-sm font-medium leading-6 text-gray-900"
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-sm font-semibold text-primary-600 hover:text-primary-500"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative mt-2">
            <LockClosedIcon
              className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
              aria-hidden="true"
            />
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${inputClass} pl-10 pr-11`}
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className="absolute inset-y-0 right-0 flex items-center rounded-r-lg pr-3 text-gray-400 hover:text-gray-600 focus-visible:outline-none focus-visible:text-primary-600"
            >
              {showPassword ? (
                <EyeSlashIcon className="h-5 w-5" aria-hidden="true" />
              ) : (
                <EyeIcon className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center">
          <input
            id="remember-me"
            name="remember-me"
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-600"
          />
          <label
            htmlFor="remember-me"
            className="ml-2.5 block text-sm leading-6 text-gray-700"
          >
            Remember me
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-3 py-2.5 text-sm font-semibold text-white shadow-raised transition hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:cursor-not-allowed disabled:opacity-75"
        >
          {loading && (
            <svg
              className="h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
          )}
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <div className="mt-8">
        <div className="relative">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-3 text-gray-500">Or continue with</span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <a href="/api/auth/oauth/google/start" className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-semibold text-gray-900 shadow-sm transition hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600">
            <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24">
                  <path
                    d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0353 3.12C17.9503 1.89 15.2353 1 12.0003 1C7.31028 1 3.25527 3.84 1.28027 7.65L5.27028 10.71C6.29028 7.28 8.91528 4.75 12.0003 4.75Z"
                    fill="#EA4335"
                  />
                  <path
                    d="M23.49 12.27C23.49 11.48 23.42 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.95 21.1C22.18 19.01 23.49 15.92 23.49 12.27Z"
                    fill="#4285F4"
                  />
                  <path
                    d="M5.26998 14.29C5.02998 13.57 4.89999 12.8 4.89999 12C4.89999 11.2 5.02998 10.43 5.26998 9.71001L1.28 6.65C0.47 8.3 0 10.1 0 12C0 13.9 0.47 15.7 1.28 17.35L5.26998 14.29Z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12.0004 23C15.2404 23 17.9604 22.01 19.9504 20.11L16.0804 17.1C15.0054 17.9 13.6204 18.42 12.0004 18.42C8.91544 18.42 6.29044 15.89 5.27044 12.46L1.27045 15.56C3.25045 19.38 7.31044 23 12.0004 23Z"
                    fill="#34A853"
                  />
                </svg>
            <span>Google</span>
          </a>
          <a href="/api/auth/oauth/github/start" className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-semibold text-gray-900 shadow-sm transition hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600">
            <svg
                  className="h-5 w-5 fill-[#24292F]"
                  aria-hidden="true"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
                    clipRule="evenodd"
                  />
                </svg>
            <span>GitHub</span>
          </a>
        </div>
      </div>

      <p className="mt-8 text-center text-sm text-gray-600">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-semibold text-primary-600 hover:text-primary-500"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
