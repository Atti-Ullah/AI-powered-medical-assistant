"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon, CheckCircleIcon, XCircleIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useAuth } from "../../../../../contexts/AuthContext";
import DashboardLayout from "../../../../../components/DashboardLayout";
import PageHeader from "../../../../../components/PageHeader";
import { adminRequest } from "../../../../../lib/admin-client";

const inputClass =
  "block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:bg-slate-50 disabled:text-slate-500";

const ROLE_BADGES = {
  doctor: "bg-blue-50 text-blue-700 ring-blue-600/20",
  admin: "bg-rose-50 text-rose-700 ring-rose-600/20",
  patient: "bg-violet-50 text-violet-700 ring-violet-600/20",
};

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
        status: form.status,
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
      <Link href="/dashboard/admin/users" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-primary-600">
        <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
        Back to users
      </Link>

      {loading ? (
        <div className="h-72 animate-pulse rounded-2xl bg-slate-100" aria-label="Loading user" />
      ) : notFound ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <p className="text-base font-semibold text-slate-900">User not found</p>
          <p className="mt-1 text-sm text-slate-500">This account may have been deleted.</p>
        </div>
      ) : !form ? (
        <div role="alert" className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <XCircleIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
          {error}
        </div>
      ) : (
        <>
          <PageHeader
            eyebrow="User profile"
            title={account.name}
            description={`Joined ${account.date || "unknown"} · ID ${account.id}`}
            actions={
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium capitalize ring-1 ring-inset ${ROLE_BADGES[account.type] || ROLE_BADGES.patient}`}>
                {account.type}
              </span>
            }
          />

          <form onSubmit={handleSave} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" aria-label="Edit user">
            {notice && (
              <div role="status" className="mb-5 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                <CheckCircleIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
                {notice}
              </div>
            )}
            {error && (
              <div role="alert" className="mb-5 flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                <XCircleIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <Field label="First name" name="firstName" value={form.firstName} onChange={handleChange} required />
              <Field label="Last name" name="lastName" value={form.lastName} onChange={handleChange} required />
              <Field label="Email" name="email" type="email" value={form.email} onChange={handleChange} required />
              <Field label="Phone" name="phone" value={form.phone} onChange={handleChange} />
              <div>
                <label htmlFor="userType" className="mb-1.5 block text-sm font-medium text-slate-700">Role</label>
                <select id="userType" name="userType" value={form.userType} onChange={handleChange} disabled={isSelf} className={inputClass}>
                  <option value="patient">Patient</option>
                  <option value="doctor">Doctor</option>
                  <option value="admin">Admin</option>
                </select>
                {isSelf && <p className="mt-1.5 text-xs text-slate-500">You cannot change your own role.</p>}
              </div>
              <div>
                <label htmlFor="status" className="mb-1.5 block text-sm font-medium text-slate-700">Account status</label>
                <select id="status" name="status" value={form.status || "active"} onChange={handleChange} disabled={isSelf} className={inputClass}>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
                <p className="mt-1.5 text-xs text-slate-500">
                  {isSelf ? "You cannot suspend your own account." : "A suspended user cannot log in or use the platform until reactivated."}
                </p>
              </div>
              <Field
                label="New password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
                hint="Leave blank to keep the current password"
              />
              {form.userType === "doctor" && (
                <>
                  <Field label="Specialty" name="specialty" value={form.specialty} onChange={handleChange} />
                  <Field label="Experience" name="experience" value={form.experience} onChange={handleChange} />
                  <div className="md:col-span-2">
                    <Field label="Education" name="education" value={form.education} onChange={handleChange} />
                  </div>
                </>
              )}
            </div>

            <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
              {!isSelf ? (
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  className="inline-flex items-center gap-2 rounded-lg border border-rose-200 px-4 py-2.5 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                >
                  <TrashIcon className="h-4 w-4" aria-hidden="true" />
                  Delete account
                </button>
              ) : (
                <span />
              )}
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>
        </>
      )}

      {confirmingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Delete account">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <TrashIcon className="h-5 w-5" aria-hidden="true" />
            </span>
            <h3 className="mt-4 text-base font-semibold text-slate-900">Delete account</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              Permanently delete <span className="font-medium text-slate-700">{account?.name}</span> and the data linked to it? This cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Keep
              </button>
              <button
                type="button"
                onClick={handleDelete}
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
