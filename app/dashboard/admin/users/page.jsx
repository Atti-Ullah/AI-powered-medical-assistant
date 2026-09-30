"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "../../../../contexts/AuthContext";
import DashboardLayout from "../../../../components/DashboardLayout";
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

const TYPE_STYLES = {
  doctor: "bg-blue-100 text-blue-800",
  admin: "bg-red-100 text-red-800",
  patient: "bg-purple-100 text-purple-800",
};

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

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="mt-1 text-sm text-gray-600">View, create, edit and remove platform accounts</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          {showForm ? "Close" : "Add New User"}
        </button>
      </div>

      {notice && (
        <div role="status" className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {notice}
        </div>
      )}
      {error && (
        <div role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 rounded-lg bg-white p-6 shadow" aria-label="Add new user">
          <h2 className="mb-4 text-lg font-medium text-gray-900">New account</h2>
          {formError && (
            <div role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {formError}
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
              hint="8+ characters with upper and lower case, a number and a symbol"
            />
            <div>
              <label htmlFor="userType" className="block text-sm font-medium text-gray-700">Role</label>
              <select
                id="userType"
                name="userType"
                value={form.userType}
                onChange={handleFormChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <Field label="Phone (optional)" name="phone" value={form.phone} onChange={handleFormChange} />
            {form.userType === "doctor" && (
              <>
                <Field label="Specialty" name="specialty" value={form.specialty} onChange={handleFormChange} />
                <Field label="Experience" name="experience" value={form.experience} onChange={handleFormChange} />
                <Field label="Education" name="education" value={form.education} onChange={handleFormChange} />
              </>
            )}
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
            >
              {saving ? "Creating..." : "Create account"}
            </button>
          </div>
        </form>
      )}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email"
          aria-label="Search users"
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm sm:max-w-sm"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          aria-label="Filter by role"
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">All roles</option>
          <option value="patient">Patients</option>
          <option value="doctor">Doctors</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow ring-1 ring-black ring-opacity-5">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              {["Name", "Email", "Role", "Joined", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {loading ? (
              <tr>
                <td colSpan="5" className="px-4 py-6 text-center text-sm text-gray-500">Loading users...</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-4 py-6 text-center text-sm text-gray-500">No users found</td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{u.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{u.email}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${TYPE_STYLES[u.type] || ""}`}>
                      {u.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{u.date}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                    <Link href={`/dashboard/admin/users/${u.id}`} className="mr-4 text-primary-600 hover:text-primary-900">
                      View / Edit
                    </Link>
                    {String(u.id) !== String(user.id) && (
                      <button
                        type="button"
                        onClick={() => setPendingDelete(u)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-medium text-gray-900">Delete account</h3>
            <p className="mt-2 text-sm text-gray-600">
              Permanently delete {pendingDelete.name} ({pendingDelete.email})? This cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Keep
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={saving}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
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
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        id={name}
        name={name}
        {...props}
        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
      />
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}
