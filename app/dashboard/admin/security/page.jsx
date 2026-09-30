"use client";

import Link from "next/link";
import { CheckIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import AdminSystemPage from "../../../../components/AdminSystemPage";

export default function AdminSecurityPage() {
  return (
    <AdminSystemPage title="Security Management" description="Configuration checks for authentication and access">
      {(status) => {
        const checks = [
          {
            name: "JWT signing secret configured",
            ok: status.security.jwtSecretConfigured,
            detail: status.security.jwtSecretConfigured
              ? "Tokens are signed with the JWT_SECRET environment variable."
              : "JWT_SECRET is not set; a development-only secret is in use.",
          },
          {
            name: "Default administrator password changed",
            ok: !status.security.defaultAdminPassword,
            detail: status.security.defaultAdminPassword
              ? "An admin account still uses the documented demo password. Change it from Settings."
              : "No administrator uses the demo password.",
          },
          {
            name: "Database connected",
            ok: status.database.connected,
            detail: status.database.connected
              ? "MongoDB is reachable."
              : "MongoDB is unreachable; the local file store is being used.",
          },
          {
            name: "More than one administrator",
            ok: status.security.adminCount > 1,
            detail: `${status.security.adminCount} administrator account(s).`,
          },
        ];
        const passed = checks.filter((c) => c.ok).length;
        return (
          <>
            <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">Security score</p>
                <p className="text-sm text-slate-500"><span className="font-semibold text-slate-900">{passed}</span> of {checks.length} checks passed</p>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={passed} aria-valuemin={0} aria-valuemax={checks.length} aria-label="Security checks passed">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${passed === checks.length ? "bg-emerald-500" : passed >= checks.length / 2 ? "bg-amber-500" : "bg-rose-500"}`}
                  style={{ width: `${(passed / checks.length) * 100}%` }}
                />
              </div>
            </div>

            <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              {checks.map((check) => (
                <li key={check.name} className="flex items-start gap-4 px-6 py-5">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${check.ok ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}
                    aria-label={check.ok ? "Passed" : "Needs attention"}
                  >
                    {check.ok ? <CheckIcon className="h-5 w-5" aria-hidden="true" /> : <ExclamationTriangleIcon className="h-5 w-5" aria-hidden="true" />}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{check.name}</p>
                    <p className="mt-0.5 text-sm text-slate-500">{check.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-slate-500">
              Session tokens expire after {status.security.tokenLifetime}. Manage administrator accounts and reset passwords
              from <Link href="/dashboard/admin/users" className="font-medium text-primary-600 hover:text-primary-700">User Management</Link>.
            </p>
          </>
        );
      }}
    </AdminSystemPage>
  );
}
