"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../../../contexts/AuthContext";
import DashboardLayout from "../../../../../components/DashboardLayout";
import { adminRequest } from "../../../../../lib/admin-client";

export default function AdminUserDetailPage() {
  const { user } = useAuth();
  const token = user?.token;
  const params = useParams();
  const router = useRouter();
  const [account, setAccount] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    async function load() {
      try {
        const result = await adminRequest(token, `/api/admin/users/${params.id}`);
        if (cancelled) return;
        setAccount(result.data);
        setForm({ ...result.data, userType: result.data.type, password: "" });
      } catch (err) {
        if (cancelled) return;
        if (/not found/i.test(err.message)) setNotFound(true);
        else setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [token, params.id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const body = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        userType: form.userType,
        specialty: form.specialty,
        experience: form.experience,
        education: form.education,
      };
      if (form.password) body.password = form.password;
      const result = await adminRequest(token, `/api/admin/users/${params.id}`, { method: "PUT", body });
      setAccount(result.data);
      setForm({ ...result.data, userType: result.data.type, password: "" });
      setNotice("Changes saved.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    setError("");
    try {
      await adminRequest(token, `/api/admin/users/${params.id}`, { method: "DELETE" });
      router.push("/dashboard/admin/users");
    } catch (err) {
      setError(err.message);
      setConfirmingDelete(false);
      setSaving(false);
    }
  };

  if (!user) return null;

  const isSelf = account && String(account.id) === String(user.id);

  return (
    <DashboardLayout>
      <Link href="/dashboard/admin/users" className="text-sm text-primary-600 hover:text-primary-800">
        &larr; Back to users
      </Link>

      {loading ? (
        <p className="mt-6 text-gray-500">Loading user...</p>
      ) : notFound ? (
        <p className="mt-6 text-gray-700">User not found.</p>
      ) : !form ? (
        <div role="alert" className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : (
        <form onSubmit={handleSave} className="mt-4 rounded-lg bg-white p-6 shadow" aria-label="Edit user">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{account.name}</h1>
              <p className="text-sm text-gray-500">
                {account.type} &middot; joined {account.date || "unknown"} &middot; ID {account.id}
              </p>
            </div>
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

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="First name" name="firstName" value={form.firstName} onChange={handleChange} required />
            <Field label="Last name" name="lastName" value={form.lastName} onChange={handleChange} required />
            <Field label="Email" name="email" type="email" value={form.email} onChange={handleChange} required />
            <Field label="Phone" name="phone" value={form.phone} onChange={handleChange} />
            <div>
              <label htmlFor="userType" className="block text-sm font-medium text-gray-700">Role</label>
              <select
                id="userType"
                name="userType"
                value={form.userType}
                onChange={handleChange}
                disabled={isSelf}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100"
              >
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
                <option value="admin">Admin</option>
              </select>
              {isSelf && <p className="mt-1 text-xs text-gray-500">You cannot change your own role.</p>}
            </div>
            <Field
              label="New password (leave blank to keep)"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              autoComplete="new-password"
            />
            {form.userType === "doctor" && (
              <>
                <Field label="Specialty" name="specialty" value={form.specialty} onChange={handleChange} />
                <Field label="Experience" name="experience" value={form.experience} onChange={handleChange} />
                <Field label="Education" name="education" value={form.education} onChange={handleChange} />
              </>
            )}
          </div>

          <div className="mt-6 flex items-center justify-between">
            {!isSelf ? (
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="rounded-md border border-red-300 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                Delete account
              </button>
            ) : (
              <span />
            )}
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      )}

      {confirmingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-medium text-gray-900">Delete account</h3>
            <p className="mt-2 text-sm text-gray-600">
              Permanently delete {account?.name}? This cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Keep
              </button>
              <button
                type="button"
                onClick={handleDelete}
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

function Field({ label, name, ...props }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        id={name}
        name={name}
        {...props}
        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
      />
    </div>
  );
}
