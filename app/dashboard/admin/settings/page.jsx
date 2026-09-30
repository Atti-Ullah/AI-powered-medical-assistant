"use client";

import { useState } from "react";
import {
  UserCircleIcon,
  KeyIcon,
  ServerStackIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../../../contexts/AuthContext";
import AdminSystemPage from "../../../../components/AdminSystemPage";
import { adminRequest, formatUptime } from "../../../../lib/admin-client";

const card = "rounded-2xl border border-slate-200 bg-white shadow-sm";

function SectionHeader({ icon: Icon, title, text }) {
  return (
    <div className="flex items-start gap-4 border-b border-slate-100 px-6 py-5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div>
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        <p className="mt-0.5 text-sm text-slate-500">{text}</p>
      </div>
    </div>
  );
}

function AccountSection({ user }) {
  const rows = [
    ["Name", user?.name || "-"],
    ["Email", user?.email || "-"],
    ["Role", "Administrator"],
  ];
  return (
    <section className={card} aria-label="Account">
      <SectionHeader icon={UserCircleIcon} title="Account" text="The administrator account you are signed in with" />
      <dl className="divide-y divide-slate-100">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 px-6 py-4 text-sm">
            <dt className="text-slate-500">{label}</dt>
            <dd className="font-medium text-slate-900">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

const RULES = [
  { label: "At least 8 characters", test: (p) => p.length >= 8 },
  { label: "Upper and lower case letters", test: (p) => /[a-z]/.test(p) && /[A-Z]/.test(p) },
  { label: "A number", test: (p) => /\d/.test(p) },
  { label: "A special character", test: (p) => /[\W_]/.test(p) },
];

function PasswordField({ id, label, value, onChange, autoComplete }) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">{label}</label>
      <div className="relative mt-1.5">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          required
          className="block w-full rounded-lg border border-slate-300 py-2.5 pl-3.5 pr-11 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600"
        >
          {visible ? <EyeSlashIcon className="h-5 w-5" aria-hidden="true" /> : <EyeIcon className="h-5 w-5" aria-hidden="true" />}
        </button>
      </div>
    </div>
  );
}

function ChangePasswordSection({ token }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const rulesMet = RULES.every((rule) => rule.test(next));
  const mismatch = confirm.length > 0 && confirm !== next;
  const canSubmit = current && rulesMet && next === confirm && !saving;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const result = await adminRequest(token, "/api/admin/change-password", {
        method: "POST",
        body: { currentPassword: current, newPassword: next },
      });
      setSuccess(result.message || "Password updated successfully");
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className={card} aria-label="Change password">
      <SectionHeader icon={KeyIcon} title="Change password" text="Use a strong password that you do not use anywhere else" />
      <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6">
        {success && (
          <div role="status" className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <CheckCircleIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
            {success}
          </div>
        )}
        {error && (
          <div role="alert" className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <XCircleIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="md:col-span-2 md:max-w-md">
            <PasswordField id="currentPassword" label="Current password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" />
          </div>
          <PasswordField id="newPassword" label="New password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" />
          <div>
            <PasswordField id="confirmPassword" label="Confirm new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
            {mismatch && <p className="mt-1.5 text-xs text-rose-600">Passwords do not match</p>}
          </div>
        </div>

        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2" aria-label="Password requirements">
          {RULES.map((rule) => {
            const met = rule.test(next);
            return (
              <li key={rule.label} className={`flex items-center gap-2 text-xs ${met ? "text-emerald-600" : "text-slate-500"}`}>
                <CheckCircleIcon className={`h-4 w-4 ${met ? "text-emerald-500" : "text-slate-300"}`} aria-hidden="true" />
                {rule.label}
              </li>
            );
          })}
        </ul>

        <div className="flex justify-end border-t border-slate-100 pt-5">
          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex items-center rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Updating..." : "Update password"}
          </button>
        </div>
      </form>
    </section>
  );
}

export default function AdminSettingsPage() {
  const { user } = useAuth();

  return (
    <AdminSystemPage
      title="System Settings"
      description="Manage your account and review the platform configuration"
      sections={
        user ? (
          <div className="mb-6 space-y-6">
            <AccountSection user={user} />
            <ChangePasswordSection token={user.token} />
          </div>
        ) : null
      }
    >
      {(status) => {
        const rows = [
          ["Environment", status.server.environment],
          ["Node.js version", status.server.nodeVersion],
          ["Server uptime", formatUptime(status.server.uptimeSeconds)],
          ["Data store", status.database.connected ? "MongoDB" : "Local file store (MongoDB unreachable)"],
          ["Site URL", status.config.siteUrl],
          ["AI assistant (Gemini)", status.config.aiAssistantConfigured ? "Configured" : "Not configured"],
          ["Session lifetime", status.security.tokenLifetime],
        ];
        return (
          <section className={card} aria-label="Platform configuration">
            <SectionHeader
              icon={ServerStackIcon}
              title="Platform configuration"
              text="Read-only values set through environment variables in .env.local"
            />
            <dl className="divide-y divide-slate-100">
              {rows.map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 px-6 py-4 text-sm">
                  <dt className="text-slate-500">{label}</dt>
                  <dd className="text-right font-medium text-slate-900">{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        );
      }}
    </AdminSystemPage>
  );
}
