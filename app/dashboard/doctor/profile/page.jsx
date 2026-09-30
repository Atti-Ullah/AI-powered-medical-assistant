"use client";

import { useState, useEffect, useRef } from "react";
import { CameraIcon, TrashIcon, PencilSquareIcon, UserIcon } from "@heroicons/react/24/outline";
import { useAuth } from "../../../../contexts/AuthContext";
import DashboardLayout from "../../../../components/DashboardLayout";
import PageHeader from "../../../../components/PageHeader";
import { apiRequest } from "../../../../lib/api-client";
import { resizeImage } from "../../../../lib/resize-image";
import {
  DOCTOR_SPECIALTIES,
  DOCTOR_LOCATIONS,
  DOCTOR_LANGUAGES,
  DOCTOR_TIME_SLOTS,
  MAX_AVATAR_LENGTH,
} from "../../../../lib/doctor-profile";
import {
  card,
  inputClass,
  primaryButton,
  secondaryButton,
  Field,
  InlineAlert,
  Skeleton,
} from "../../../../components/DoctorUI";

const EMPTY = {
  name: "", email: "", phone: "", specialty: DOCTOR_SPECIALTIES[0], education: "", experienceYears: "",
  hospital: "", location: DOCTOR_LOCATIONS[0], licenseNumber: "", bio: "", languages: ["English", "Urdu"],
  consultationFee: "", availableTimeSlots: DOCTOR_TIME_SLOTS.slice(0, 6), avatar: "", joinDate: "",
};

function Avatar({ src, name }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={`${name || "Doctor"} profile`} className="h-28 w-28 rounded-full object-cover shadow-md ring-4 ring-white" />
  ) : (
    <span className="flex h-28 w-28 items-center justify-center rounded-full bg-primary-50 text-primary-600 shadow-md ring-4 ring-white">
      <UserIcon className="h-14 w-14" aria-hidden="true" />
    </span>
  );
}

// A wrap of toggle chips for picking several values from a fixed list
function ChipGroup({ label, options, value, onToggle }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((option) => {
        const on = value.includes(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() => onToggle(option)}
            aria-pressed={on}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
              on ? "border-primary-600 bg-primary-600 text-white shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

export default function DoctorProfilePage() {
  const { user, updateProfile } = useAuth();
  const token = user?.token;
  const [profile, setProfile] = useState(EMPTY);
  const [form, setForm] = useState(EMPTY);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const fileInput = useRef(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const result = await apiRequest(token, "/api/doctor/profile");
        if (cancelled) return;
        setProfile(result.data);
        setForm(result.data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const set = (name) => (e) => setForm((prev) => ({ ...prev, [name]: e.target.value }));
  // Functional update so quick successive toggles never overwrite each other
  const toggleIn = (name) => (option) =>
    setForm((prev) => ({ ...prev, [name]: prev[name].includes(option) ? prev[name].filter((v) => v !== option) : [...prev[name], option] }));

  const startEditing = () => {
    setForm(profile);
    setError("");
    setNotice("");
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setForm(profile);
    setError("");
    setIsEditing(false);
  };

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const avatar = await resizeImage(file, { maxLength: MAX_AVATAR_LENGTH });
      setForm((prev) => ({ ...prev, avatar }));
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
      const { email, joinDate, ...editable } = form;
      const result = await apiRequest(token, "/api/doctor/profile", { method: "PUT", body: editable });
      setProfile(result.data);
      setForm(result.data);
      // Keep the header and other pages in sync with the saved profile
      updateProfile({ name: result.data.name, phone: result.data.phone, avatar: result.data.avatar });
      setIsEditing(false);
      setNotice("Profile updated. Patients will see the new details when booking.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  const shown = isEditing ? form : profile;
  const rows = [
    ["Full name", profile.name],
    ["Email", profile.email],
    ["Phone number", profile.phone],
    ["Specialty", profile.specialty],
    ["Qualifications", profile.education],
    ["Experience", profile.experienceYears === "" ? "" : `${profile.experienceYears} years`],
    ["Hospital affiliation", profile.hospital],
    ["City", profile.location],
    ["License number", profile.licenseNumber],
    ["Consultation fee", profile.consultationFee === "" ? "" : `Rs. ${Number(profile.consultationFee).toLocaleString()}`],
    ["Languages", profile.languages.join(", ")],
    ["Member since", profile.joinDate],
  ];

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl">
        <PageHeader
          eyebrow="Account"
          title="Doctor profile"
          description="This is what patients see when they browse doctors and book with you."
          actions={
            !isEditing && !loading ? (
              <button type="button" onClick={startEditing} className={primaryButton}>
                <PencilSquareIcon className="h-5 w-5" aria-hidden="true" />
                Edit profile
              </button>
            ) : null
          }
        />

        {notice && <div className="mb-4"><InlineAlert kind="success" onDismiss={() => setNotice("")}>{notice}</InlineAlert></div>}
        {error && <div className="mb-4"><InlineAlert>{error}</InlineAlert></div>}

        <div className={`${card} overflow-hidden`}>
          <div className="h-24 bg-gradient-to-r from-primary-600 to-primary-400" aria-hidden="true" />
          <div className="px-5 pb-8 sm:px-6">
            <div className="-mt-14 flex flex-col items-center gap-4 sm:flex-row sm:items-end">
              <Avatar src={shown.avatar} name={shown.name} />
              <div className="text-center sm:pb-2 sm:text-left">
                <p className="text-lg font-semibold text-slate-900">{shown.name ? `Dr. ${shown.name.replace(/^Dr\.?\s+/i, "")}` : "Doctor"}</p>
                <p className="text-sm text-slate-500">{[shown.specialty, shown.hospital].filter(Boolean).join(" · ")}</p>
              </div>
              {isEditing && (
                <div className="flex gap-2 sm:ml-auto sm:pb-2">
                  <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp" onChange={handlePhoto} className="sr-only" aria-label="Upload profile picture" />
                  <button type="button" onClick={() => fileInput.current?.click()} className={secondaryButton}>
                    <CameraIcon className="h-4 w-4" aria-hidden="true" />
                    {form.avatar ? "Change photo" : "Add photo"}
                  </button>
                  {form.avatar && (
                    <button type="button" onClick={() => setForm((prev) => ({ ...prev, avatar: "" }))} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-rose-600 shadow-sm transition hover:bg-rose-50">
                      <TrashIcon className="h-4 w-4" aria-hidden="true" />
                      Remove
                    </button>
                  )}
                </div>
              )}
            </div>

            {loading ? (
              <div className="mt-8 space-y-4"><Skeleton className="h-10" /><Skeleton className="h-10" /><Skeleton className="h-10" /></div>
            ) : isEditing ? (
              <form onSubmit={handleSubmit} className="mt-8">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <Field label="Full name" htmlFor="name">
                    <input id="name" type="text" value={form.name} onChange={set("name")} required className={inputClass} />
                  </Field>
                  <Field label="Email" htmlFor="email" hint="Your email is your login and cannot be changed here.">
                    <input id="email" type="email" value={form.email} disabled className={inputClass} />
                  </Field>
                  <Field label="Phone number" htmlFor="phone">
                    <input id="phone" type="tel" value={form.phone} onChange={set("phone")} placeholder="+92 300 1234567" className={inputClass} />
                  </Field>
                  <Field label="Specialty" htmlFor="specialty">
                    <select id="specialty" value={form.specialty} onChange={set("specialty")} className={inputClass}>
                      {DOCTOR_SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </Field>
                  <Field label="Qualifications" htmlFor="education">
                    <input id="education" type="text" value={form.education} onChange={set("education")} maxLength={200} placeholder="e.g. MBBS, FCPS (Cardiology)" className={inputClass} />
                  </Field>
                  <Field label="Years of experience" htmlFor="experienceYears">
                    <input id="experienceYears" type="number" min="0" max="60" step="1" value={form.experienceYears} onChange={set("experienceYears")} className={inputClass} />
                  </Field>
                  <Field label="Hospital affiliation" htmlFor="hospital">
                    <input id="hospital" type="text" value={form.hospital} onChange={set("hospital")} maxLength={120} placeholder="e.g. Shifa International Hospital" className={inputClass} />
                  </Field>
                  <Field label="City" htmlFor="location">
                    <select id="location" value={form.location} onChange={set("location")} className={inputClass}>
                      {DOCTOR_LOCATIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </Field>
                  <Field label="License number" htmlFor="licenseNumber" hint="Letters, numbers, dashes and slashes">
                    <input id="licenseNumber" type="text" value={form.licenseNumber} onChange={set("licenseNumber")} maxLength={30} placeholder="e.g. PMDC-12345" className={inputClass} />
                  </Field>
                  <Field label="Consultation fee (Rs.)" htmlFor="consultationFee">
                    <input id="consultationFee" type="number" min="0" max="100000" step="100" value={form.consultationFee} onChange={set("consultationFee")} className={inputClass} />
                  </Field>
                  <div className="md:col-span-2">
                    <Field label="Languages spoken" htmlFor="languages" hint="Choose at least one">
                      <ChipGroup label="Languages" options={DOCTOR_LANGUAGES} value={form.languages} onToggle={toggleIn("languages")} />
                    </Field>
                  </div>
                  <div className="md:col-span-2">
                    <Field label="Available time slots" htmlFor="slots" hint="Patients choose from these when booking. Choose at least one.">
                      <ChipGroup label="Available time slots" options={DOCTOR_TIME_SLOTS} value={form.availableTimeSlots} onToggle={toggleIn("availableTimeSlots")} />
                    </Field>
                  </div>
                  <div className="md:col-span-2">
                    <Field label="About you" htmlFor="bio" hint={`${form.bio.length}/600 characters`}>
                      <textarea id="bio" rows={4} maxLength={600} value={form.bio} onChange={set("bio")} placeholder="A short introduction: your focus areas and approach to care" className={inputClass} />
                    </Field>
                  </div>
                </div>

                <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
                  <button type="button" onClick={cancelEditing} className={secondaryButton}>Cancel</button>
                  <button type="submit" disabled={saving} className={primaryButton}>{saving ? "Saving..." : "Save changes"}</button>
                </div>
              </form>
            ) : (
              <>
                <dl className="mt-8 grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
                  {rows.map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</dt>
                      <dd className="mt-1 break-words text-sm font-medium text-slate-900">{value || <span className="font-normal text-slate-400">Not provided</span>}</dd>
                    </div>
                  ))}
                  <div className="sm:col-span-2">
                    <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">Available time slots</dt>
                    <dd className="mt-2 flex flex-wrap gap-2">
                      {profile.availableTimeSlots.map((s) => <span key={s} className="rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700">{s}</span>)}
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">About</dt>
                    <dd className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-700">{profile.bio || <span className="text-slate-400">Not provided</span>}</dd>
                  </div>
                </dl>
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
