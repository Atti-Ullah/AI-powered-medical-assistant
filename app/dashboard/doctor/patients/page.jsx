"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MagnifyingGlassIcon, UserGroupIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import DashboardLayout from "../../../../components/DashboardLayout";
import PageHeader from "../../../../components/PageHeader";
import {
  card,
  inputClass,
  Avatar,
  RiskBadge,
  EmptyState,
  InlineAlert,
  Skeleton,
  formatDate,
  useApiData,
} from "../../../../components/DoctorUI";

const FILTERS = [
  { value: "", label: "All patients" },
  { value: "attention", label: "Needs attention" },
  { value: "upcoming", label: "Has upcoming visit" },
];

export default function DoctorPatientsPage() {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [filter, setFilter] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search.trim()), 250);
    return () => clearTimeout(timer);
  }, [search]);

  const params = new URLSearchParams();
  if (debounced) params.set("search", debounced);
  if (filter) params.set("filter", filter);
  const { data: patients, loading, error } = useApiData(`/api/doctor/patients?${params}`);
  const filtered = !!(debounced || filter);

  return (
    <DashboardLayout>
      <PageHeader
        eyebrow="Doctor workspace"
        title="My patients"
        description="Everyone who has booked an appointment with you, most urgent first."
      />

      {error && <div className="mb-6"><InlineAlert>{error}</InlineAlert></div>}

      <div className={card}>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              type="text"
              role="searchbox"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email or condition"
              aria-label="Search patients"
              className={`${inputClass} pl-10`}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter patients">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setFilter(f.value)}
                aria-pressed={filter === f.value}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                  filter === f.value ? "bg-primary-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {f.label}
              </button>
            ))}
            <span className="ml-1 whitespace-nowrap text-sm text-slate-500" aria-live="polite">
              {loading && !patients ? "Loading..." : `${patients?.length ?? 0} ${patients?.length === 1 ? "patient" : "patients"}`}
            </span>
          </div>
        </div>

        {loading && !patients ? (
          <div className="space-y-3 p-5">
            {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}
          </div>
        ) : patients?.length ? (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full divide-y divide-slate-200">
                <thead>
                  <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th scope="col" className="px-6 py-3">Patient</th>
                    <th scope="col" className="px-6 py-3">Status</th>
                    <th scope="col" className="hidden px-6 py-3 lg:table-cell">Conditions</th>
                    <th scope="col" className="px-6 py-3">Last visit</th>
                    <th scope="col" className="px-6 py-3">Next visit</th>
                    <th scope="col" className="px-6 py-3"><span className="sr-only">Open</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {patients.map((p) => (
                    <tr key={p.id} className="transition hover:bg-slate-50/70">
                      <td className="px-6 py-4">
                        <Link href={`/dashboard/doctor/patients/${p.id}`} className="flex items-center gap-3">
                          <Avatar name={p.name} />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-900">{p.name}</p>
                            <p className="truncate text-xs text-slate-500">
                              {[p.age ? `${p.age} yrs` : null, p.gender ? p.gender.charAt(0).toUpperCase() + p.gender.slice(1) : null].filter(Boolean).join(" · ") || p.email}
                            </p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <RiskBadge risk={p.risk} />
                        {p.topFlag && <p className="mt-1 max-w-[16rem] truncate text-xs text-slate-500">{p.topFlag.title}</p>}
                      </td>
                      <td className="hidden max-w-[12rem] truncate px-6 py-4 text-sm text-slate-600 lg:table-cell">{p.medicalConditions || "-"}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">{p.lastVisit ? formatDate(p.lastVisit) : "-"}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">{p.nextAppointment ? `${formatDate(p.nextAppointment.date)}, ${p.nextAppointment.time}` : "-"}</td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/dashboard/doctor/patients/${p.id}`} aria-label={`Open ${p.name}`} className="inline-flex rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-primary-600">
                          <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <ul className="divide-y divide-slate-100 md:hidden">
              {patients.map((p) => (
                <li key={p.id}>
                  <Link href={`/dashboard/doctor/patients/${p.id}`} className="block px-4 py-4 transition hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <Avatar name={p.name} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-900">{p.name}</p>
                        <p className="truncate text-xs text-slate-500">
                          {[p.age ? `${p.age} yrs` : null, p.medicalConditions].filter(Boolean).join(" · ") || p.email}
                        </p>
                      </div>
                      <ChevronRightIcon className="h-5 w-5 shrink-0 text-slate-300" aria-hidden="true" />
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 pl-[3.25rem]">
                      <RiskBadge risk={p.risk} />
                      <span className="text-xs text-slate-500">
                        {p.nextAppointment ? `Next: ${formatDate(p.nextAppointment.date)}` : p.lastVisit ? `Last: ${formatDate(p.lastVisit)}` : "No visits"}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <EmptyState
            icon={UserGroupIcon}
            title={filtered ? "No patients match" : "No patients yet"}
            text={filtered ? "Try a different search or filter." : "Patients appear here once they book an appointment with you."}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
