"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ExclamationTriangleIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../../../contexts/AuthContext";
import DashboardLayout from "../../../../components/DashboardLayout";
import PageHeader from "../../../../components/PageHeader";

// Rule-based guidance: every condition lists the symptoms we look for. This is a prompt to
// talk to a clinician, not a diagnosis.
const CONDITIONS = [
  {
    name: "Common cold",
    symptoms: ["runny nose", "sore throat", "cough", "congestion", "sneezing", "mild fever"],
    advice: "Rest, fluids and steam inhalation usually help. See a doctor if symptoms last more than 10 days.",
    care: "Usually self-care",
  },
  {
    name: "Influenza (flu)",
    symptoms: ["fever", "headache", "muscle pain", "fatigue", "cough", "chills", "sore throat"],
    advice: "Rest and drink plenty of fluids. See a doctor if you are over 65, pregnant, or have a long-term condition.",
    care: "See a doctor if it worsens",
  },
  {
    name: "Migraine",
    symptoms: ["headache", "nausea", "sensitivity to light", "blurred vision", "vomiting", "dizziness"],
    advice: "Rest in a dark, quiet room. A doctor can suggest preventive treatment if attacks are frequent.",
    care: "Book a routine visit",
  },
  {
    name: "Allergic rhinitis",
    symptoms: ["sneezing", "itchy eyes", "runny nose", "congestion", "cough"],
    advice: "Avoid known triggers. Antihistamines may help; ask a pharmacist or doctor first.",
    care: "Usually self-care",
  },
  {
    name: "Gastroenteritis",
    symptoms: ["nausea", "vomiting", "diarrhea", "abdominal pain", "fever", "dehydration"],
    advice: "Sip oral rehydration solution. See a doctor urgently if you cannot keep fluids down or see blood in stool.",
    care: "See a doctor if it persists",
  },
  {
    name: "Hypertension (high blood pressure)",
    symptoms: ["headache", "dizziness", "blurred vision", "chest pain", "shortness of breath"],
    advice: "Have your blood pressure measured. Persistent high readings need medical follow-up.",
    care: "Book a routine visit",
  },
  {
    name: "Type 2 diabetes (warning signs)",
    symptoms: ["excessive thirst", "frequent urination", "fatigue", "blurred vision", "slow healing wounds"],
    advice: "A simple blood sugar test can confirm. Early treatment prevents complications.",
    care: "Book a routine visit",
  },
  {
    name: "Urinary tract infection",
    symptoms: ["burning urination", "frequent urination", "abdominal pain", "fever", "cloudy urine"],
    advice: "Drink water and see a doctor; a short course of antibiotics is often needed.",
    care: "See a doctor soon",
  },
  {
    name: "Asthma flare-up",
    symptoms: ["wheezing", "shortness of breath", "cough", "chest tightness"],
    advice: "Use your reliever inhaler as prescribed. Seek urgent care if it does not help.",
    care: "See a doctor soon",
  },
  {
    name: "Anemia (low iron)",
    symptoms: ["fatigue", "dizziness", "pale skin", "shortness of breath", "headache"],
    advice: "A blood count (CBC) can confirm. Iron-rich food and supplements are common treatments.",
    care: "Book a routine visit",
  },
];

// Symptoms that may point to an emergency regardless of the matches
const RED_FLAGS = [
  "chest pain",
  "shortness of breath",
  "difficulty breathing",
  "severe bleeding",
  "fainting",
  "confusion",
  "slurred speech",
  "face drooping",
  "seizure",
  "suicidal",
  "coughing blood",
  "vomiting blood",
];

const QUICK_SYMPTOMS = [
  "fever",
  "headache",
  "cough",
  "sore throat",
  "runny nose",
  "fatigue",
  "nausea",
  "vomiting",
  "diarrhea",
  "abdominal pain",
  "muscle pain",
  "dizziness",
  "shortness of breath",
  "chest pain",
  "blurred vision",
];

// Split the text into clean, lower-case phrases. Empty entries and one-or-two letter fragments
// are dropped so a stray comma can never match everything.
function parseSymptoms(text) {
  return [...new Set(text.toLowerCase().split(/[,;\n]+/).map((s) => s.trim().replace(/\s+/g, " ")).filter((s) => s.length >= 3))];
}

function matches(conditionSymptom, entered) {
  return conditionSymptom === entered || conditionSymptom.includes(entered) || entered.includes(conditionSymptom);
}

export default function SymptomCheckerPage() {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [checked, setChecked] = useState([]);

  const entered = useMemo(() => parseSymptoms(text), [text]);

  const addSymptom = (symptom) => {
    const current = parseSymptoms(text);
    if (current.includes(symptom)) {
      setText(current.filter((s) => s !== symptom).join(", "));
    } else {
      setText([...current, symptom].join(", "));
    }
  };

  const reset = () => {
    setText("");
    setResults(null);
    setChecked([]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (entered.length === 0) return;
    setLoading(true);

    const found = CONDITIONS.map((condition) => {
      const matched = condition.symptoms.filter((symptom) => entered.some((entry) => matches(symptom, entry)));
      return {
        ...condition,
        matched,
        percentage: Math.round((matched.length / condition.symptoms.length) * 100),
      };
    })
      .filter((c) => c.matched.length > 0)
      .sort((a, b) => b.percentage - a.percentage || b.matched.length - a.matched.length)
      .slice(0, 5);

    // A red flag needs the whole phrase: plain "cough" must not trigger "coughing blood"
    const redFlags = RED_FLAGS.filter((flag) => entered.some((entry) => entry.includes(flag)));

    setChecked(entered);
    // A short pause so the result feels deliberate rather than instantaneous
    setTimeout(() => {
      setResults({ conditions: found, redFlags });
      setLoading(false);
    }, 600);
  };

  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl">
        <PageHeader
          eyebrow="Patient"
          title="Symptom Checker"
          description="Tell us how you feel and see which common conditions fit, with a suggested next step."
          actions={
            <Link
              href="/dashboard/patient/ai-doctor"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-primary-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
            >
              <SparklesIcon className="h-4 w-4" aria-hidden="true" />
              Ask the AI Doctor
            </Link>
          }
        />

        <div className="mb-6 flex items-start gap-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-800 ring-1 ring-amber-200">
          <InformationCircleIcon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <p>
            This tool compares your symptoms with a small built-in list of common conditions. It is{" "}
            <strong>not a diagnosis</strong> and cannot replace a doctor.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <label htmlFor="symptoms" className="block text-sm font-semibold text-slate-900">
            What symptoms do you have?
          </label>
          <p className="mt-1 text-sm text-slate-500">Type them separated by commas, or tap the common ones below.</p>

          <textarea
            id="symptoms"
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. headache, fever, cough"
            className="mt-3 block w-full resize-none rounded-lg border-0 px-3.5 py-2.5 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary-600"
          />

          <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Common symptoms">
            {QUICK_SYMPTOMS.map((symptom) => {
              const active = entered.includes(symptom);
              return (
                <button
                  key={symptom}
                  type="button"
                  onClick={() => addSymptom(symptom)}
                  aria-pressed={active}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                    active
                      ? "bg-primary-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {symptom}
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={loading || entered.length === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <MagnifyingGlassIcon className="h-4 w-4" aria-hidden="true" />
              {loading ? "Checking..." : "Check symptoms"}
            </button>
            {(text || results) && (
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
              >
                <XMarkIcon className="h-4 w-4" aria-hidden="true" />
                Clear
              </button>
            )}
            {entered.length > 0 && (
              <span className="text-sm text-slate-500">
                {entered.length} symptom{entered.length === 1 ? "" : "s"} selected
              </span>
            )}
          </div>
        </form>

        {results && (
          <div className="mt-8 space-y-6" aria-live="polite">
            {results.redFlags.length > 0 && (
              <div role="alert" className="flex items-start gap-3 rounded-xl bg-red-50 p-4 ring-1 ring-red-200">
                <ExclamationTriangleIcon className="mt-0.5 h-6 w-6 shrink-0 text-red-600" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-red-800">Some of these symptoms can be serious</p>
                  <p className="mt-1 text-sm text-red-700">
                    You mentioned <strong>{results.redFlags.join(", ")}</strong>. If this is happening now or is
                    severe, go to the nearest emergency department or call an ambulance (Edhi 115, Rescue 1122).
                  </p>
                </div>
              </div>
            )}

            {results.conditions.length > 0 ? (
              <>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Conditions that fit your symptoms</h2>
                  <p className="text-sm text-slate-500">
                    Based on: {checked.join(", ")}. Percentages show how many of a condition&apos;s typical symptoms you
                    reported.
                  </p>
                </div>
                <ul className="space-y-4">
                  {results.conditions.map((c) => (
                    <li key={c.name} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-base font-semibold text-slate-900">{c.name}</h3>
                        <span className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-700">
                          {c.care}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center gap-3">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-primary-500 transition-all duration-500" style={{ width: `${c.percentage}%` }} />
                        </div>
                        <span className="w-12 text-right text-sm font-semibold text-slate-700">{c.percentage}%</span>
                      </div>
                      <p className="mt-3 text-sm text-slate-600">
                        <span className="font-medium text-slate-800">Matching symptoms:</span> {c.matched.join(", ")}
                      </p>
                      <p className="mt-2 text-sm text-slate-600">
                        <span className="font-medium text-slate-800">What to do:</span> {c.advice}
                      </p>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <div className="rounded-xl bg-blue-50 p-4 text-sm text-blue-800 ring-1 ring-blue-200">
                None of the conditions we cover matched what you entered. Try describing it differently, or talk to a
                doctor if you are worried.
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
              <p className="mr-auto text-sm font-medium text-slate-700">Not sure what to do next?</p>
              <Link
                href="/dashboard/patient/find-doctor"
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-500"
              >
                Find a doctor
              </Link>
              <Link
                href="/dashboard/patient/ai-doctor"
                className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
              >
                Ask the AI Doctor
              </Link>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
