"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  BeakerIcon,
  PhotoIcon,
  DocumentArrowUpIcon,
  PaperClipIcon,
  XMarkIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import DashboardLayout from "../../../../components/DashboardLayout";
import PageHeader from "../../../../components/PageHeader";
import { apiRequest } from "../../../../lib/api-client";
import { REPORT_IMAGE_MODALITIES, REPORT_LAB_TESTS } from "../../../../lib/doctor-profile";
import {
  card,
  inputClass,
  primaryButton,
  secondaryButton,
  Field,
  InlineAlert,
  Skeleton,
  EmptyState,
  localToday,
  useApiData,
} from "../../../../components/DoctorUI";

const MAX_FILE_BYTES = 2 * 1024 * 1024;
const FILE_TYPES = ["application/pdf", "image/png", "image/jpeg"];
const EMPTY_FORM = { patientId: "", kind: "lab", detail: "", title: "", date: "", findings: "", recommendations: "" };

const formatSize = (bytes) => (bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`);

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.readAsDataURL(file);
  });
}

export default function DoctorUploadReportPage() {
  const { data: patients, loading, error: loadError, token } = useApiData("/api/doctor/patients");
  const [form, setForm] = useState({ ...EMPTY_FORM, date: localToday() });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(null);
  const fileInput = useRef(null);

  // Arriving from a patient's page: ?patient=<id>
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("patient");
    if (id) setForm((prev) => ({ ...prev, patientId: id }));
  }, []);

  const options = form.kind === "lab" ? REPORT_LAB_TESTS : REPORT_IMAGE_MODALITIES;
  const set = (name) => (e) => setForm((prev) => ({ ...prev, [name]: e.target.value }));
  const selectedPatient = patients?.find((p) => p.id === form.patientId);

  const chooseKind = (kind) => setForm((prev) => ({ ...prev, kind, detail: "" }));

  const handleFile = (e) => {
    const chosen = e.target.files?.[0];
    e.target.value = "";
    if (!chosen) return;
    if (!FILE_TYPES.includes(chosen.type)) {
      setError("Attach a PDF, PNG or JPEG file.");
      return;
    }
    if (chosen.size > MAX_FILE_BYTES) {
      setError("That file is too large. The maximum size is 2 MB.");
      return;
    }
    setError("");
    setFile(chosen);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.patientId) return setError("Choose a patient.");
    if (!form.detail) return setError(form.kind === "lab" ? "Choose the lab test." : "Choose the imaging type.");
    if (!form.findings.trim()) return setError("Enter the findings or interpretation.");
    setSaving(true);
    setError("");
    try {
      const body = { ...form, title: form.title.trim() || form.detail };
      if (file) {
        body.file = await readAsDataUrl(file);
        body.fileName = file.name;
      }
      await apiRequest(token, "/api/doctor/reports", { method: "POST", body });
      setSaved({ patientId: form.patientId, name: selectedPatient?.name || "the patient", title: body.title });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setForm({ ...EMPTY_FORM, date: localToday() });
    setFile(null);
    setSaved(null);
    setError("");
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl">
        <PageHeader
          eyebrow="Doctor workspace"
          title="Upload report"
          description="Add a lab or imaging report to a patient's medical records. The patient can see it straight away."
        />

        {loadError && <div className="mb-6"><InlineAlert>{loadError}</InlineAlert></div>}

        {saved ? (
          <div className={`${card} p-8 text-center`}>
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircleIcon className="h-8 w-8" aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-lg font-semibold text-slate-900">Report saved</h2>
            <p className="mt-1 text-sm text-slate-500">&ldquo;{saved.title}&rdquo; was added to {saved.name}&apos;s records.</p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href={`/dashboard/doctor/patients/${saved.patientId}`} className={primaryButton}>View patient</Link>
              <button type="button" onClick={reset} className={secondaryButton}>Upload another</button>
            </div>
          </div>
        ) : loading && !patients ? (
          <div className="space-y-4"><Skeleton className="h-20" /><Skeleton className="h-64" /></div>
        ) : !patients?.length ? (
          <div className={card}>
            <EmptyState icon={DocumentArrowUpIcon} title="No patients to upload for" text="You can add reports for patients who have booked an appointment with you." />
          </div>
        ) : (
          <form onSubmit={submit} className={`${card} space-y-6 p-5 sm:p-6`} aria-label="Upload report">
            {error && <InlineAlert>{error}</InlineAlert>}

            <Field label="Patient" htmlFor="patientId">
              <select id="patientId" value={form.patientId} onChange={set("patientId")} required className={inputClass}>
                <option value="">Select a patient</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}{p.age ? ` (${p.age} yrs)` : ""}</option>
                ))}
              </select>
            </Field>

            <div>
              <p className="mb-1.5 text-sm font-medium text-slate-700">Report type</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Report type">
                {[
                  { kind: "lab", label: "Lab report", text: "Blood tests, urinalysis and similar", icon: BeakerIcon },
                  { kind: "imaging", label: "Imaging", text: "X-ray, MRI, CT, ultrasound", icon: PhotoIcon },
                ].map((option) => (
                  <button
                    key={option.kind}
                    type="button"
                    role="radio"
                    aria-checked={form.kind === option.kind}
                    onClick={() => chooseKind(option.kind)}
                    className={`flex items-center gap-4 rounded-xl border p-4 text-left transition ${
                      form.kind === option.kind ? "border-primary-600 bg-primary-50 ring-1 ring-primary-600" : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${form.kind === option.kind ? "bg-primary-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                      <option.icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-slate-900">{option.label}</span>
                      <span className="block text-xs text-slate-500">{option.text}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label={form.kind === "lab" ? "Lab test" : "Imaging type"} htmlFor="detail">
                <select id="detail" value={form.detail} onChange={set("detail")} required className={inputClass}>
                  <option value="">Select</option>
                  {options.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </Field>
              <Field label="Report date" htmlFor="date">
                <input id="date" type="date" max={localToday()} value={form.date} onChange={set("date")} required className={inputClass} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Title" htmlFor="title" hint="Defaults to the test or imaging type">
                  <input id="title" type="text" maxLength={150} value={form.title} onChange={set("title")} placeholder={form.detail || "e.g. Lipid profile, March"} className={inputClass} />
                </Field>
              </div>
            </div>

            <Field label="Findings / interpretation" htmlFor="findings">
              <textarea id="findings" rows={5} maxLength={4000} value={form.findings} onChange={set("findings")} required placeholder="Key results and your interpretation" className={inputClass} />
            </Field>
            <Field label="Recommendations (optional)" htmlFor="recommendations">
              <textarea id="recommendations" rows={3} maxLength={2000} value={form.recommendations} onChange={set("recommendations")} placeholder="Follow-up tests, lifestyle advice, medication changes" className={inputClass} />
            </Field>

            <div>
              <p className="mb-1.5 text-sm font-medium text-slate-700">Attachment (optional)</p>
              <input ref={fileInput} type="file" accept=".pdf,image/png,image/jpeg" onChange={handleFile} className="sr-only" aria-label="Attach a file" />
              {file ? (
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <PaperClipIcon className="h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">{file.name}</p>
                    <p className="text-xs text-slate-500">{formatSize(file.size)}</p>
                  </div>
                  <button type="button" onClick={() => setFile(null)} aria-label="Remove attachment" className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700">
                    <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => fileInput.current?.click()} className="flex w-full flex-col items-center rounded-xl border-2 border-dashed border-slate-300 px-6 py-8 text-center transition hover:border-primary-400 hover:bg-primary-50/40">
                  <DocumentArrowUpIcon className="h-8 w-8 text-slate-400" aria-hidden="true" />
                  <span className="mt-2 text-sm font-medium text-primary-600">Choose a file</span>
                  <span className="mt-1 text-xs text-slate-500">PDF, PNG or JPEG, up to 2 MB</span>
                </button>
              )}
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
              <Link href="/dashboard/doctor/patients" className={secondaryButton}>Cancel</Link>
              <button type="submit" disabled={saving} className={primaryButton}>{saving ? "Saving..." : "Save report"}</button>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}
