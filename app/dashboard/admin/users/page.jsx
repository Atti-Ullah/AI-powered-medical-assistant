"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  MagnifyingGlassIcon,
  UserPlusIcon,
  PencilSquareIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../../../contexts/AuthContext";
import DashboardLayout from "../../../../components/DashboardLayout";
import AdminPageHeader from "../../../../components/AdminPageHeader";
import { adminRequest } from "../../../../lib/admin-client";

const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  userType: "patient",
  phone: "",
  specialty: "",
  experience: "",
  education: "",
};

const ROLE_BADGES = {
  doctor: "bg-blue-50 text-blue-700 ring-blue-600/20",
  admin: "bg-rose-50 text-rose-700 ring-rose-600/20",
  patient: "bg-violet-50 text-violet-700 ring-violet-600/20",
};

const card = "rounded-2xl border border-slate-200 bg-white shadow-sm";
const inputClass =
  "block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20";

export default function AdminUsersPage() {
  const { user } = useAuth();
  const token = user?.token;
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);

  const loadUsers = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (typeFilter) params.set("type", typeFilter);
      const result = await adminRequest(token, `/api/admin/users?${params}`);
      setUsers(result.data);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, search, typeFilter]);

  useEffect(() => {
    const timer = setTimeout(loadUsers, 250); // debounce typing in the search box
    return () => clearTimeout(timer);
  }, [loadUsers]);

  // "Add New User" on the dashboard links here with ?new=1
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("new")) setShowForm(true);
  }, []);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      const result = await adminRequest(token, "/api/admin/users", { method: "POST", body: form });
      setNotice(`Created ${result.data.type} account for ${result.data.name}.`);
      setShowForm(false);
      setForm(EMPTY_FORM);
      loadUsers();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setSaving(true);
    try {
      await adminRequest(token, `/api/admin/users/${pendingDelete.id}`, { method: "DELETE" });
      setNotice(`Deleted ${pendingDelete.name}.`);
      setError("");
      loadUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
      setPendingDelete(null);
    }
  };

  if (!user) return null;

  const filtered = !!(search || typeFilter);

  return (
    <DashboardLayout>
      <AdminPageHeader
        title="User Management"
        description="View, create, edit and remove platform accounts"
        actions={
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            <UserPlusIcon className="h-5 w-5" aria-hidden="true" />
            {showForm ? "Close form" : "Add New User"}
          </button>
        }
      />

      {notice && (
        <div role="status" className="mb-4 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircleIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span className="flex-1">{notice}</span>
          <button type="button" onClick={() => setNotice("")} className="text-xs font-medium text-emerald-700 hover:underline">Dismiss</button>
        </div>
      )}
      {error && (
        <div role="alert" className="mb-4 flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <XCircleIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
          {error}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className={`${card} mb-6 p-6`} aria-label="Add new user">
          <h2 className="text-base font-semibold text-slate-900">New account</h2>
          <p className="mb-5 mt-0.5 text-sm text-slate-500">The person can sign in straight away with the temporary password.</p>
          {formError && (
            <div role="alert" className="mb-5 flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <XCircleIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
              {formError}
            </div>
          )}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Field label="First name" name="firstName" value={form.firstName} onChange={handleFormChange} required />
            <Field label="Last name" name="lastName" value={form.lastName} onChange={handleFormChange} required />
            <Field label="Email" name="email" type="email" value={form.email} onChange={handleFormChange} required />
            <Field
              label="Temporary password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleFormChange}
              required
              autoComplete="new-password"
              hint="8+ characters with upper and lower case, a number and a symbol"
            />
            <div>
              <label htmlFor="userType" className="mb-1.5 block text-sm font-medium text-slate-700">Role</label>
              <select id="userType" name="userType" value={form.userType} onChange={handleFormChange} className={inputClass}>
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <Field label="Phone (optional)" name="phone" value={form.phone} onChange={handleFormChange} />
            {form.userType === "doctor" && (
              <>
                <Field label="Specialty" name="specialty" value={form.specialty} onChange={handleFormChange} />
                <Field label="Experience" name="experience" value={form.experience} onChange={handleFormChange} placeholder="e.g. 8 years" />
                <div className="md:col-span-2">
                  <Field label="Education" name="education" value={form.education} onChange={handleFormChange} />
                </div>
              </>
            )}
          </div>
          <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 disabled:opacity-60"
            >
              {saving ? "Creating..." : "Create account"}
            </button>
          </div>
        </form>
      )}

      <div className={card}>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              type="text"
              role="searchbox"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email"
              aria-label="Search users"
              className={`${inputClass} pl-10`}
            />
          </div>
          <div className="flex items-center gap-3">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              aria-label="Filter by role"
              className={`${inputClass} w-auto`}
            >
              <option value="">All roles</option>
              <option value="patient">Patients</option>
              <option value="doctor">Doctors</option>
              <option value="admin">Admins</option>
            </select>
            <p className="whitespace-nowrap text-sm text-slate-500" aria-live="polite">
              {loading ? "Loading..." : `${users.length} ${users.length === 1 ? "user" : "users"}`}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th scope="col" className="px-4 py-3 sm:px-6">User</th>
                <th scope="col" className="hidden px-6 py-3 sm:table-cell">Role</th>
                <th scope="col" className="hidden px-6 py-3 md:table-cell">Joined</th>
                <th scope="col" className="px-2 py-3 text-right sm:px-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && users.length === 0 ? (
                [0, 1, 2, 3, 4].map((i) => (
                  <tr key={i}>
                    <td colSpan="4" className="px-6 py-3"><div className="h-10 animate-pulse rounded-lg bg-slate-100" /></td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-14 text-center">
                    <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                      <UsersIcon className="h-6 w-6" aria-hidden="true" />
                    </span>
                    <p className="mt-3 text-sm font-medium text-slate-900">{filtered ? "No users match your search" : "No users yet"}</p>
                    <p className="mt-1 text-xs text-slate-500">{filtered ? "Try a different name, email or role." : "Add the first account to get started."}</p>
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="transition hover:bg-slate-50/70">
                    <td className="px-4 py-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
                          {u.name?.charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0 max-w-[11rem] sm:max-w-none">
                          <p className="truncate text-sm font-medium text-slate-900">{u.name}</p>
                          <p className="truncate text-xs text-slate-500">{u.email}</p>
                          <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ring-1 ring-inset sm:hidden ${ROLE_BADGES[u.type] || ROLE_BADGES.patient}`}>
                            {u.type}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="hidden whitespace-nowrap px-6 py-4 sm:table-cell">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${ROLE_BADGES[u.type] || ROLE_BADGES.patient}`}>
                        {u.type}
                      </span>
                    </td>
                    <td className="hidden whitespace-nowrap px-6 py-4 text-sm text-slate-500 md:table-cell">{u.date}</td>
                    <td className="whitespace-nowrap px-2 py-4 text-right sm:px-6">
                      <Link
                        href={`/dashboard/admin/users/${u.id}`}
                        aria-label={`Edit ${u.name}`}
                        title="View / edit"
                        className="inline-flex rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-primary-600"
                      >
                        <PencilSquareIcon className="h-5 w-5" aria-hidden="true" />
                      </Link>
                      {String(u.id) !== String(user.id) && (
                        <button
                          type="button"
                          onClick={() => setPendingDelete(u)}
                          aria-label={`Delete ${u.name}`}
                          title="Delete"
                          className="inline-flex rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                        >
                          <TrashIcon className="h-5 w-5" aria-hidden="true" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Delete account">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <TrashIcon className="h-5 w-5" aria-hidden="true" />
            </span>
            <h3 className="mt-4 text-base font-semibold text-slate-900">Delete account</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              Permanently delete <span className="font-medium text-slate-700">{pendingDelete.name}</span> ({pendingDelete.email})
              and the appointments, records and medications linked to it? This cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Keep
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={saving}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60"
              >
                {saving ? "Deleting..." : "Yes, delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function Field({ label, name, hint, ...props }) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      <input id={name} name={name} {...props} className={inputClass} />
      {hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
