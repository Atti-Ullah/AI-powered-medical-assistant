"use client";

import Link from "next/link";
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
              ? "An admin account still uses the documented demo password."
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
        return (
          <>
            <ul className="divide-y divide-gray-200 rounded-lg bg-white shadow">
              {checks.map((check) => (
                <li key={check.name} className="flex items-start gap-3 px-6 py-4">
                  <span
                    className={`mt-0.5 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                      check.ok ? "bg-green-500" : "bg-red-500"
                    }`}
                    aria-label={check.ok ? "Passed" : "Needs attention"}
                  >
                    {check.ok ? "✓" : "!"}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">{check.name}</p>
                    <p className="text-sm text-gray-600">{check.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-gray-600">
              Session tokens expire after {status.security.tokenLifetime}. Manage administrator accounts and reset passwords
              from <Link href="/dashboard/admin/users" className="text-primary-600 hover:text-primary-800">User Management</Link>.
            </p>
          </>
        );
      }}
    </AdminSystemPage>
  );
}
