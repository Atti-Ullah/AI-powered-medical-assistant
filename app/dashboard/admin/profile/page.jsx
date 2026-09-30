"use client";

import { useState, useEffect, useRef } from "react";
import {
  UserIcon,
  CameraIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../../../contexts/AuthContext";
import { adminRequest } from "../../../../lib/admin-client";
import {
  ADMIN_ROLES,
  ADMIN_DEPARTMENTS,
  ADMIN_PERMISSIONS,
  PROFILE_DEFAULTS,
  MAX_AVATAR_LENGTH,
} from "../../../../lib/admin-profile";

const card = "rounded-2xl border border-slate-200 bg-white shadow-sm";
const inputClass =
  "block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:bg-slate-50 disabled:text-slate-500";

const EMPTY = {
  name: "",
  email: "",
  phone: "",
  adminRole: PROFILE_DEFAULTS.adminRole,
  department: PROFILE_DEFAULTS.department,
  permissions: PROFILE_DEFAULTS.permissions,
  joinDate: "",
  avatar: "",
};

// Shrinks a chosen image to a small square-ish JPEG so it can be stored with the profile
function resizeImage(file, maxSize = 256) {
  return new Promise((resolve, reject) => {
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
      reject(new Error("Please choose a PNG, JPEG or WebP image."));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("That file is not a valid image."));
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        if (dataUrl.length > MAX_AVATAR_LENGTH) {
          reject(new Error("That image is too large. Try a smaller one."));
        } else {
          resolve(dataUrl);
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function Field({ label, htmlFor, children, hint }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

function Select({ id, name, value, onChange, options }) {
  return (
    <select id={id} name={name} value={value} onChange={onChange} className={inputClass}>
      {options.map((option) => (
        <option key={option} value={option}>{option}</option>
      ))}
    </select>
  );
}

function Avatar({ src, name, size = "h-28 w-28" }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={`${name || "Administrator"} profile`} className={`${size} rounded-full object-cover ring-4 ring-white shadow-md`} />
  ) : (
    <span className={`${size} flex items-center justify-center rounded-full bg-primary-50 text-primary-600 ring-4 ring-white shadow-md`}>
      <UserIcon className="h-1/2 w-1/2" aria-hidden="true" />
    </span>
  );
}

export default function AdminProfilePage() {
  const { user, updateProfile } = useAuth();
  const token = user?.token;
  const [profile, setProfile] = useState(EMPTY);
  const [formData, setFormData] = useState(EMPTY);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const fileInput = useRef(null);

  // Load the saved profile from the server
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    async function load() {
      try {
        const result = await adminRequest(token, "/api/admin/profile");
        if (cancelled) return;
        setProfile(result.data);
        setFormData(result.data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const startEditing = () => {
    setFormData(profile);
    setError("");
    setNotice("");
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setFormData(profile);
    setError("");
    setIsEditing(false);
  };

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const avatar = await resizeImage(file);
      setFormData((prev) => ({ ...prev, avatar }));
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const result = await adminRequest(token, "/api/admin/profile", {
        method: "PUT",
        body: {
          name: formData.name,
          phone: formData.phone,
          adminRole: formData.adminRole,
          department: formData.department,
          permissions: formData.permissions,
          avatar: formData.avatar,
        },
      });
      setProfile(result.data);
      setFormData(result.data);
      // Keep the header and other pages in sync with the saved profile
      updateProfile({ name: result.data.name, phone: result.data.phone, avatar: result.data.avatar });
      setIsEditing(false);
      setNotice("Profile updated successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  const shown = isEditing ? formData : profile;
  const readOnlyRows = [
    ["Full name", profile.name],
    ["Email", profile.email],
    ["Phone number", profile.phone],
    ["Administrative role", profile.adminRole],
    ["Department", profile.department],
    ["Join date", profile.joinDate],
    ["System permissions", profile.permissions],
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary-600">Account</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Administrator Profile</h1>
          <p className="mt-1 text-sm text-slate-500">Manage your personal details and how you appear on the platform.</p>
        </div>
        {!isEditing && !loading && (
          <button
            type="button"
            onClick={startEditing}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            <PencilSquareIcon className="h-5 w-5" aria-hidden="true" />
            Edit Profile
          </button>
        )}
      </div>

      {notice && (
        <div role="status" className="mb-4 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircleIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
          {notice}
        </div>
      )}
      {error && (
        <div role="alert" className="mb-4 flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <XCircleIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
          {error}
        </div>
      )}

      <div className={`${card} overflow-hidden`}>
        <div className="h-24 bg-gradient-to-r from-primary-600 to-primary-400" aria-hidden="true" />

        <div className="px-6 pb-8">
          <div className="-mt-14 flex flex-col items-center gap-4 sm:flex-row sm:items-end">
            <Avatar src={shown.avatar} name={shown.name} />
            <div className="text-center sm:pb-2 sm:text-left">
              <p className="text-lg font-semibold text-slate-900">{shown.name || "Administrator"}</p>
              <p className="text-sm text-slate-500">{shown.adminRole} &middot; {shown.department}</p>
            </div>
            {isEditing && (
              <div className="flex gap-2 sm:ml-auto sm:pb-2">
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handlePhoto}
                  className="sr-only"
                  aria-label="Upload profile picture"
                />
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  <CameraIcon className="h-4 w-4" aria-hidden="true" />
                  {formData.avatar ? "Change photo" : "Add photo"}
                </button>
                {formData.avatar && (
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, avatar: "" }))}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-rose-600 shadow-sm transition hover:bg-rose-50"
                  >
                    <TrashIcon className="h-4 w-4" aria-hidden="true" />
                    Remove
                  </button>
                )}
              </div>
            )}
          </div>

          {loading ? (
            <p className="mt-8 text-sm text-slate-500">Loading profile...</p>
          ) : isEditing ? (
            <form onSubmit={handleSubmit} className="mt-8">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Field label="Full name" htmlFor="name">
                  <input id="name" name="name" type="text" value={formData.name} onChange={handleChange} required className={inputClass} />
                </Field>
                <Field label="Email" htmlFor="email" hint="Your email is your login and cannot be changed here.">
                  <input id="email" name="email" type="email" value={formData.email} disabled className={inputClass} />
                </Field>
                <Field label="Phone number" htmlFor="phone">
                  <input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="+92 300 1234567" className={inputClass} />
                </Field>
                <Field label="Administrative role" htmlFor="adminRole">
                  <Select id="adminRole" name="adminRole" value={formData.adminRole} onChange={handleChange} options={ADMIN_ROLES} />
                </Field>
                <Field label="Department" htmlFor="department">
                  <Select id="department" name="department" value={formData.department} onChange={handleChange} options={ADMIN_DEPARTMENTS} />
                </Field>
                <Field label="Join date" htmlFor="joinDate" hint="Set automatically when the account was created.">
                  <input id="joinDate" name="joinDate" type="text" value={formData.joinDate || "Not available"} disabled className={inputClass} />
                </Field>
                <div className="md:col-span-2">
                  <Field label="System permissions" htmlFor="permissions">
                    <Select id="permissions" name="permissions" value={formData.permissions} onChange={handleChange} options={ADMIN_PERMISSIONS} />
                  </Field>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3 border-t border-slate-100 pt-6">
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          ) : (
            <dl className="mt-8 grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
              {readOnlyRows.map(([label, value], index) => (
                <div key={label} className={index === readOnlyRows.length - 1 ? "md:col-span-2" : ""}>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</dt>
                  <dd className="mt-1 text-sm font-medium text-slate-900">{value || "Not provided"}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>
    </div>
  );
}
