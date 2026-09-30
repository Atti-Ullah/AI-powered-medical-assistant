"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  MagnifyingGlassIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  PencilSquareIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import DashboardLayout from "../../../../components/DashboardLayout";
import PageHeader from "../../../../components/PageHeader";
import { apiRequest } from "../../../../lib/api-client";
import { DOCTOR_TIME_SLOTS } from "../../../../lib/doctor-profile";
import {
  card,
  inputClass,
  primaryButton,
  secondaryButton,
  Avatar,
  StatusBadge,
  EmptyState,
  InlineAlert,
  Skeleton,
  Dialog,
  Field,
  formatDate,
  relativeDay,
  localToday,
  useApiData,
} from "../../../../components/DoctorUI";

const TABS = [
  { value: "today", label: "Today" },
  { value: "upcoming", label: "Upcoming" },
  { value: "overdue", label: "Overdue" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const isActive = (a) => a.status !== "cancelled" && a.status !== "completed";

function tabOf(a, today) {
  if (a.status === "cancelled") return "cancelled";
  if (a.status === "completed") return "completed";
  if (a.date === today) return "today";
  return a.date > today ? "upcoming" : "overdue";
}

export default function DoctorConsultationsPage() {
  const { data: appointments, loading, error, reload, token } = useApiData("/api/doctor/appointments");
  const [tab, setTab] = useState("today");
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState(null); // { kind, appointment }
  const [form, setForm] = useState({ diagnosis: "", doctorNotes: "", date: "", time: DOCTOR_TIME_SLOTS[0] });
  const [saving, setSaving] = useState(false);
  const [dialogError, setDialogError] = useState("");
  const [notice, setNotice] = useState("");
  const today = localToday();

  // Deep links from the dashboard and patient pages: ?tab=overdue&search=Name
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (TABS.some((t) => t.value === params.get("tab"))) setTab(params.get("tab"));
    if (params.get("search")) setSearch(params.get("search"));
  }, []);

  const counts = useMemo(() => {
    const c = Object.fromEntries(TABS.map((t) => [t.value, 0]));
    (appointments || []).forEach((a) => {
      c[tabOf(a, today)]++;
    });
    return c;
  }, [appointments, today]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    const rows = (appointments || []).filter((a) => tabOf(a, today) === tab && (!term || a.patientName.toLowerCase().includes(term) || a.reason.toLowerCase().includes(term)));
    // Finished visits read best newest first; everything else soonest first
    return tab === "completed" || tab === "cancelled" ? [...rows].reverse() : rows;
  }, [appointments, tab, search, today]);

  const openDialog = (kind, appointment) => {
    setForm({
      diagnosis: appointment.diagnosis || "",
      doctorNotes: kind === "cancel" ? "" : appointment.doctorNotes || "",
      date: appointment.date >= today ? appointment.date : today,
      time: DOCTOR_TIME_SLOTS.includes(appointment.time) ? appointment.time : DOCTOR_TIME_SLOTS[0],
    });
    setDialogError("");
    setDialog({ kind, appointment });
  };

  const closeDialog = () => {
    if (!saving) setDialog(null);
  };

  const submit = async (e) => {
    e.preventDefault();
    const { kind, appointment } = dialog;
    const body =
      kind === "complete" ? { status: "completed", diagnosis: form.diagnosis, doctorNotes: form.doctorNotes }
      : kind === "cancel" ? { status: "cancelled", doctorNotes: form.doctorNotes }
      : kind === "reschedule" ? { date: form.date, time: form.time }
      : { diagnosis: form.diagnosis, doctorNotes: form.doctorNotes };
    setSaving(true);
    setDialogError("");
    try {
      await apiRequest(token, `/api/doctor/appointments/${appointment.id}`, { method: "PUT", body });
      const verb = { complete: "marked as completed", cancel: "cancelled", reschedule: "rescheduled", notes: "updated" }[kind];
      setNotice(`Visit with ${appointment.patientName} ${verb}.`);
      setDialog(null);
      await reload();
    } catch (err) {
      setDialogError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const titles = {
    complete: ["Complete consultation", "Record what you found. The patient will see the diagnosis and notes in their consultations."],
    cancel: ["Cancel appointment", "The patient will see this visit as cancelled."],
    reschedule: ["Reschedule appointment", "Pick a new date and time slot for this visit."],
    notes: ["Edit diagnosis and notes", "Update what you recorded for this consultation."],
  };

  return (
    <DashboardLayout>
      <PageHeader
        eyebrow="Doctor workspace"
        title="Consultations"
        description="Manage your visits: complete them with notes, reschedule or cancel."
      />

      {notice && <div className="mb-4"><InlineAlert kind="success" onDismiss={() => setNotice("")}>{notice}</InlineAlert></div>}
      {error && <div className="mb-4"><InlineAlert>{error}</InlineAlert></div>}

      <div className={card}>
        <div className="border-b border-slate-100 px-4 pt-4 sm:px-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-sm">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                type="text"
                role="searchbox"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by patient or reason"
                aria-label="Search consultations"
                className={`${inputClass} pl-10`}
              />
            </div>
          </div>
          <div role="tablist" aria-label="Consultation groups" className="-mb-px mt-4 flex gap-5 overflow-x-auto sm:gap-6">
            {TABS.map((t) => (
              <button
                key={t.value}
                role="tab"
                type="button"
                aria-selected={tab === t.value}
                onClick={() => setTab(t.value)}
                className={`flex shrink-0 items-center gap-2 border-b-2 pb-3 text-sm font-medium transition ${
                  tab === t.value ? "border-primary-600 text-primary-700" : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
                }`}
              >
                {t.label}
                <span className={`rounded-full px-2 py-0.5 text-xs ${t.value === "overdue" && counts.overdue > 0 ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"}`}>{counts[t.value]}</span>
              </button>
            ))}
          </div>
        </div>

        {loading && !appointments ? (
          <div className="space-y-3 p-5">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-20" />)}</div>
        ) : visible.length ? (
          <ul className="divide-y divide-slate-100" aria-label={`${tab} consultations`}>
            {visible.map((a) => (
              <li key={a.id} className="px-4 py-5 sm:px-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex min-w-0 gap-4">
                    <div className="hidden w-24 shrink-0 sm:block">
                      <p className="text-sm font-semibold text-slate-900">{a.time}</p>
                      <p className="text-xs text-slate-500">{formatDate(a.date)}</p>
                      {isActive(a) && <p className="mt-0.5 text-xs font-medium text-primary-600">{relativeDay(a.date)}</p>}
                    </div>
                    <Avatar name={a.patientName} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <Link href={`/dashboard/doctor/patients/${a.patientId}`} className="truncate text-sm font-semibold text-slate-900 hover:text-primary-600">{a.patientName}</Link>
                        <StatusBadge status={isActive(a) && a.date < today ? "upcoming" : a.status} />
                        {isActive(a) && a.date < today && <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">Overdue</span>}
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500 sm:hidden">
                        <ClockIcon className="mr-1 inline h-3.5 w-3.5 align-text-bottom" aria-hidden="true" />
                        {formatDate(a.date)} at {a.time}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {[a.patientAge ? `${a.patientAge} yrs` : null, a.reason].filter(Boolean).join(" · ") || "No reason given"}
                      </p>
                      {a.diagnosis && <p className="mt-2 text-sm text-slate-900"><span className="font-medium">Diagnosis:</span> {a.diagnosis}</p>}
                      {a.doctorNotes && <p className="mt-1 text-sm text-slate-600"><span className="font-medium text-slate-700">Notes:</span> {a.doctorNotes}</p>}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2 lg:justify-end">
                    {isActive(a) && a.date <= today && (
                      <button type="button" onClick={() => openDialog("complete", a)} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700">
                        <CheckCircleIcon className="h-4 w-4" aria-hidden="true" />
                        Complete
                      </button>
                    )}
                    {isActive(a) && (
                      <>
                        <button type="button" onClick={() => openDialog("reschedule", a)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                          <ArrowPathIcon className="h-4 w-4 text-slate-400" aria-hidden="true" />
                          Reschedule
                        </button>
                        <button type="button" onClick={() => openDialog("cancel", a)} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50">
                          <XCircleIcon className="h-4 w-4" aria-hidden="true" />
                          Cancel
                        </button>
                      </>
                    )}
                    {a.status === "completed" && (
                      <button type="button" onClick={() => openDialog("notes", a)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                        <PencilSquareIcon className="h-4 w-4 text-slate-400" aria-hidden="true" />
                        Edit notes
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={CalendarDaysIcon}
            title={search ? "No consultations match your search" : `No ${tab} consultations`}
            text={search ? "Try a different name or reason." : tab === "today" ? "Nothing is scheduled for today." : tab === "overdue" ? "You have no open visits from previous days." : "They will appear here as they happen."}
          />
        )}
      </div>

      {dialog && (
        <Dialog
          title={titles[dialog.kind][0]}
          description={`${titles[dialog.kind][1]} (${dialog.appointment.patientName}, ${formatDate(dialog.appointment.date)} at ${dialog.appointment.time})`}
          onClose={closeDialog}
          wide
          footer={
            <>
              <button type="button" onClick={closeDialog} disabled={saving} className={secondaryButton}>Back</button>
              <button type="submit" form="consultation-form" disabled={saving} className={dialog.kind === "cancel" ? "inline-flex items-center justify-center rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:opacity-60" : primaryButton}>
                {saving ? "Saving..." : dialog.kind === "complete" ? "Mark completed" : dialog.kind === "cancel" ? "Cancel appointment" : "Save"}
              </button>
            </>
          }
        >
          <form id="consultation-form" onSubmit={submit} className="space-y-4">
            {dialogError && <InlineAlert>{dialogError}</InlineAlert>}
            {(dialog.kind === "complete" || dialog.kind === "notes") && (
              <Field label="Diagnosis" htmlFor="diagnosis" hint="A short summary, up to 500 characters">
                <input id="diagnosis" type="text" maxLength={500} value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} className={inputClass} placeholder="e.g. Essential hypertension, stable" autoFocus />
              </Field>
            )}
            {dialog.kind !== "reschedule" && (
              <Field label={dialog.kind === "cancel" ? "Reason (optional)" : "Notes"} htmlFor="doctorNotes" hint={dialog.kind === "cancel" ? "Shown to the patient with the cancelled visit" : "Visible to the patient. Up to 2000 characters"}>
                <textarea id="doctorNotes" rows={4} maxLength={2000} value={form.doctorNotes} onChange={(e) => setForm({ ...form, doctorNotes: e.target.value })} className={inputClass} placeholder={dialog.kind === "cancel" ? "e.g. Clinic closed, please rebook" : "Findings, advice and follow-up"} />
              </Field>
            )}
            {dialog.kind === "reschedule" && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="New date" htmlFor="date">
                  <input id="date" type="date" min={today} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required className={inputClass} />
                </Field>
                <Field label="Time slot" htmlFor="time">
                  <select id="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className={inputClass}>
                    {DOCTOR_TIME_SLOTS.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
                  </select>
                </Field>
              </div>
            )}
          </form>
        </Dialog>
      )}
    </DashboardLayout>
  );
}
