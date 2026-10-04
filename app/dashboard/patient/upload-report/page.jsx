"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../contexts/AuthContext";
import DashboardLayout from "../../../../components/DashboardLayout";
import {
  DocumentArrowUpIcon,
  DocumentTextIcon,
  PhotoIcon,
  XMarkIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  SparklesIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

// List of supported image types
const IMAGE_MODALITIES = [
  { value: "x-ray-chest", label: "X-ray (Chest)" },
  { value: "x-ray-bone", label: "X-ray (Bone)" },
  { value: "mri-brain", label: "MRI (Brain)" },
  { value: "mri-spine", label: "MRI (Spine)" },
  { value: "mri-knee", label: "MRI (Knee)" },
  { value: "ct-chest", label: "CT Scan (Chest)" },
  { value: "ct-abdomen", label: "CT Scan (Abdomen)" },
  { value: "ct-brain", label: "CT Scan (Brain)" },
  { value: "ultrasound-breast", label: "Ultrasound (Breast)" },
  { value: "ultrasound-abdomen", label: "Ultrasound (Abdomen)" },
  { value: "ultrasound-pregnancy", label: "Ultrasound (Pregnancy)" },
  { value: "mammogram", label: "Mammogram" },
];

// List of supported lab test types
const LAB_TEST_TYPES = [
  { value: "cbc", label: "Complete Blood Count (CBC)" },
  { value: "lipid-profile", label: "Lipid Profile" },
  { value: "liver-function", label: "Liver Function Test (LFT)" },
  { value: "kidney-function", label: "Kidney Function Test (KFT)" },
  { value: "thyroid-function", label: "Thyroid Function Test" },
  { value: "blood-glucose", label: "Blood Glucose Test" },
  { value: "hba1c", label: "HbA1c (Glycated Hemoglobin)" },
  { value: "vitamin-panel", label: "Vitamin Panel" },
  { value: "urinalysis", label: "Urinalysis" },
  { value: "covid-test", label: "COVID-19 Test" },
  { value: "other", label: "Other Blood Test" },
];

export default function UploadReportPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [reportType, setReportType] = useState(""); // 'image' or 'lab'
  const [selectedModality, setSelectedModality] = useState("");
  const [selectedTestType, setSelectedTestType] = useState("");
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [savedToRecords, setSavedToRecords] = useState(false);
  const [error, setError] = useState("");

  // Reset form when report type changes
  const handleReportTypeChange = (type) => {
    setReportType(type);
    setSelectedModality("");
    setSelectedTestType("");
    setFile(null);
    setFilePreview(null);
    setError("");
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("File is too large. Maximum size is 10MB.");
      return;
    }

    const validImageTypes = ["image/jpeg", "image/png", "image/dicom"];
    const validDocumentTypes = ["application/pdf", "image/jpeg", "image/png"];

    if (reportType === "image" && !validImageTypes.includes(selectedFile.type)) {
      setError("Please upload a valid image file (JPEG, PNG, or DICOM).");
      return;
    }

    if (reportType === "lab" && !validDocumentTypes.includes(selectedFile.type)) {
      setError("Please upload a valid document (PDF, JPEG, or PNG).");
      return;
    }

    setFile(selectedFile);
    setError("");

    if (selectedFile.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setFilePreview(null);
    }
  };

  // Builds the mock analysis + plain-language summary + reasoning trace.
  function buildAnalysis() {
    if (reportType === "image") {
      if (selectedModality === "x-ray-chest") {
        return {
          findings:
            "No significant abnormalities detected in the lung fields. Heart size is normal. No pleural effusions.",
          impression: "Normal chest radiograph.",
          recommendations: "No follow-up imaging required.",
          confidence: 94,
          plainLanguage:
            "Your chest X-ray looks unremarkable. The AI did not find signs of infection, fluid, or an enlarged heart. That is reassuring — no extra scans are needed right now, but keep up normal check-ups.",
          reasoning: [
            "Lung fields compared against typical healthy patterns — no opacity or consolidation seen.",
            "Cardiac silhouette fell within normal size range on the scout measurements.",
            "No evidence of pleural fluid collection along the diaphragm border.",
          ],
          flagged: false,
        };
      }
      if (selectedModality.includes("mri")) {
        return {
          findings:
            "Normal brain parenchyma. No evidence of acute infarction, mass, or hemorrhage. Ventricles are normal in size and configuration.",
          impression: "Normal MRI study without evidence of pathology.",
          recommendations: "No additional imaging recommended at this time.",
          confidence: 87,
          plainLanguage:
            "The brain scan was smooth and clear. The AI found no bleeding, blockages, or unusual growths, and the fluid spaces look normal. Nothing here needs urgent attention.",
          reasoning: [
            "No regions of restricted diffusion that would suggest a fresh stroke.",
            "Ventricular size compared against age-matched reference ranges — within limits.",
            "No shift of mid-line structures or mass-like signal changes detected.",
          ],
          flagged: false,
        };
      }
      return {
        findings: "Examination reveals normal anatomy and structure. No abnormalities detected.",
        impression: "Normal imaging study.",
        recommendations: "No further imaging required at this time.",
        confidence: 91,
        plainLanguage:
          "Nothing of concern stood out in this scan. The structures looked normal, so no additional imaging was recommended.",
        reasoning: [
          "Anatomy matched expected baseline appearance for the study type.",
          "No suspicious density or border irregularities identified on review.",
        ],
        flagged: false,
      };
    }

    // Lab reports
    if (selectedTestType === "cbc") {
      return {
        abnormalValues: [
          {
            parameter: "White Blood Cells",
            value: "11.2 × 10^9/L",
            referenceRange: "4.5-11.0 × 10^9/L",
            status: "High",
          },
        ],
        interpretation:
          "Slightly elevated white blood cell count may indicate mild infection or inflammation.",
        recommendations:
          "Consider follow-up testing if symptoms persist. Stay hydrated and monitor for fever.",
        confidence: 89,
        plainLanguage:
          "Your white blood cell count came back a touch above the normal band. That often simply means your body is fighting a mild infection, like a cold. Unless you have fever or other symptoms, it usually settles on its own — your doctor can re-check if it worries you.",
        reasoning: [
          "WBC of 11.2 exceeded the upper reference limit of 11.0 by a small margin.",
          "Other CBC parameters (red cells, platelets, hemoglobin) are within range, so a broad marrow concern is unlikely.",
          "This pattern is most consistent with mild reactive inflammation or infection.",
        ],
        flagged: true,
      };
    }
    if (selectedTestType === "lipid-profile") {
      return {
        abnormalValues: [
          {
            parameter: "LDL Cholesterol",
            value: "145 mg/dL",
            referenceRange: "<130 mg/dL",
            status: "High",
          },
        ],
        interpretation:
          "Elevated LDL cholesterol indicates increased risk for cardiovascular disease.",
        recommendations:
          "Dietary modifications recommended. Increase physical activity and reduce saturated fat intake.",
        confidence: 92,
        plainLanguage:
          "Your 'bad' cholesterol (LDL) is slightly above the recommended target. This is common and very manageable — eating fewer saturated fats, moving more, and re-checking in a few months usually brings it down. Not an emergency.",
        reasoning: [
          "LDL at 145 mg/dL is above the <130 mg/dL treatment threshold.",
          "Total cholesterol:HDL ratio remains favorable, suggesting early-stage pattern.",
          "No personal history of cardiovascular events on file — primary prevention stage.",
        ],
        flagged: true,
      };
    }
    return {
      abnormalValues: [],
      interpretation: "All values are within normal ranges.",
      recommendations: "Continue with regular health check-ups as recommended by your physician.",
      confidence: 95,
      plainLanguage:
        "Everything checked came back inside its normal band. Nothing on this report needs follow-up — just keep your regular check-ups.",
      reasoning: [
        "Every marker fell within its laboratory reference interval.",
        "No cross-marker pattern of concern (e.g., combined liver or renal stress).",
      ],
      flagged: false,
    };
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (reportType === "image" && !selectedModality) {
      setError("Please select an image modality.");
      return;
    }

    if (reportType === "lab" && !selectedTestType) {
      setError("Please select a lab test type.");
      return;
    }

    if (!file) {
      setError("Please upload a file.");
      return;
    }

    setIsUploading(true);
    setError("");

    try {
      // In a real deployment this would stream to the analysis endpoint.
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", user.id);
      if (reportType === "image") {
        formData.append("reportType", "image");
        formData.append("modality", selectedModality);
      } else {
        formData.append("reportType", "lab");
        formData.append("testType", selectedTestType);
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
      const analysis = buildAnalysis();
      setAnalysisResult(analysis);
      setUploadComplete(true);

      // Keep the result: add it to the patient's Medical Records so it can be found later
      try {
        const label =
          (reportType === "image"
            ? IMAGE_MODALITIES.find((m) => m.value === selectedModality)?.label
            : LAB_TEST_TYPES.find((t) => t.value === selectedTestType)?.label) || "Report";
        const saveResponse = await fetch("/api/patient/upload-record", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.token}` },
          body: JSON.stringify({
            title: `${label} - AI summary`,
            type: reportType === "image" ? "imaging" : "lab",
            date: new Date().toLocaleDateString("en-CA"),
            doctor: "Medisynix AI summary",
            findings: `${analysis.plainLanguage}

Impression: ${analysis.impression || (analysis.flagged ? "Some values outside the normal range." : "Within normal limits.")}`,
            status: analysis.flagged ? "reviewed" : "Active",
          }),
        });
        setSavedToRecords(saveResponse.ok);
      } catch (saveError) {
        console.warn("Could not save the summary to records:", saveError);
      }
    } catch (err) {
      setError("An error occurred while uploading the file. Please try again.");
      console.error("Upload error:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setSavedToRecords(false);
    setReportType("");
    setSelectedModality("");
    setSelectedTestType("");
    setFile(null);
    setFilePreview(null);
    setUploadComplete(false);
    setAnalysisResult(null);
    setError("");
  };

  if (!user) {
    return null;
  }

  const reportLabel =
    reportType === "image"
      ? IMAGE_MODALITIES.find((m) => m.value === selectedModality)?.label
      : LAB_TEST_TYPES.find((t) => t.value === selectedTestType)?.label;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page header */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-900 via-brand-700 to-secondary-800 p-6 text-white shadow-card sm:p-8">
          <div
            className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-secondary-400/20 blur-3xl"
            aria-hidden="true"
          />
          <div className="relative">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Upload a medical report
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-brand-100/90">
              Upload an imaging study or lab report and get a plain-language
              explanation with a confidence score and the key points behind it.
              The summary is saved to your Medical Records.
            </p>
          </div>
        </section>

        {!uploadComplete ? (
          <div className="card rounded-2xl p-6 sm:p-8">
            <form onSubmit={handleSubmit}>
              {!reportType ? (
                <div>
                  <h2 className="text-lg font-semibold text-ink">What kind of report?</h2>
                  <p className="mt-1 text-sm text-muted">
                    Choose the closest match so the explanation fits your report.
                  </p>
                  <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => handleReportTypeChange("image")}
                      className="card card-hover rounded-xl border-2 border-transparent p-6 text-center hover:border-brand-500"
                    >
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-600/10 text-brand-700">
                        <PhotoIcon className="h-6 w-6" aria-hidden="true" />
                      </div>
                      <p className="mt-3 text-base font-semibold text-ink">Medical image</p>
                      <p className="mt-1 text-sm text-muted">X-ray, MRI, CT, Ultrasound</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReportTypeChange("lab")}
                      className="card card-hover rounded-xl border-2 border-transparent p-6 text-center hover:border-secondary-500"
                    >
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary-600/10 text-secondary-700">
                        <DocumentTextIcon className="h-6 w-6" aria-hidden="true" />
                      </div>
                      <p className="mt-3 text-base font-semibold text-ink">Lab test report</p>
                      <p className="mt-1 text-sm text-muted">Blood, urine & more</p>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-ink">
                      Upload {reportType === "image" ? "medical image" : "lab test report"}
                    </h2>
                    <button
                      type="button"
                      onClick={() => handleReportTypeChange("")}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted transition-colors hover:bg-surface-muted hover:text-ink"
                      aria-label="Back"
                    >
                      <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>

                  {reportType === "image" && (
                    <div className="mt-6">
                      <label className="mb-1.5 block text-sm font-medium text-ink">
                        Image modality
                      </label>
                      <select
                        value={selectedModality}
                        onChange={(e) => setSelectedModality(e.target.value)}
                        className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-sm text-ink focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                        required
                      >
                        <option value="">Select image type</option>
                        {IMAGE_MODALITIES.map((modality) => (
                          <option key={modality.value} value={modality.value}>
                            {modality.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {reportType === "lab" && (
                    <div className="mt-6">
                      <label className="mb-1.5 block text-sm font-medium text-ink">
                        Lab test type
                      </label>
                      <select
                        value={selectedTestType}
                        onChange={(e) => setSelectedTestType(e.target.value)}
                        className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-sm text-ink focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                        required
                      >
                        <option value="">Select test type</option>
                        {LAB_TEST_TYPES.map((test) => (
                          <option key={test.value} value={test.value}>
                            {test.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="mt-6">
                    <label className="mb-1.5 block text-sm font-medium text-ink">Report file</label>
                    <div className="mt-1">
                      {filePreview ? (
                        <div className="flex flex-col items-center rounded-xl border-2 border-dashed border-border px-6 py-6">
                          <img
                            src={filePreview}
                            alt="Preview"
                            className="mb-3 h-40 object-contain"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setFile(null);
                              setFilePreview(null);
                            }}
                            className="text-sm font-medium text-destructive-600 hover:text-destructive-700"
                          >
                            Remove file
                          </button>
                        </div>
                      ) : file && file.type === "application/pdf" ? (
                        <div className="flex flex-col items-center rounded-xl border-2 border-dashed border-border px-6 py-6">
                          <DocumentTextIcon className="h-12 w-12 text-muted" aria-hidden="true" />
                          <p className="mt-2 text-sm font-medium text-ink">{file.name}</p>
                          <button
                            type="button"
                            onClick={() => {
                              setFile(null);
                              setFilePreview(null);
                            }}
                            className="mt-2 text-sm font-medium text-destructive-600 hover:text-destructive-700"
                          >
                            Remove file
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center rounded-xl border-2 border-dashed border-border px-6 py-8 text-center">
                          <DocumentArrowUpIcon className="h-12 w-12 text-muted" aria-hidden="true" />
                          <div className="mt-3 flex text-sm text-muted">
                            <label
                              htmlFor="file-upload"
                              className="relative cursor-pointer font-semibold text-brand-600 hover:text-brand-700"
                            >
                              <span>Upload a file</span>
                              <input
                                id="file-upload"
                                name="file-upload"
                                type="file"
                                className="sr-only"
                                onChange={handleFileChange}
                                accept={
                                  reportType === "image"
                                    ? "image/jpeg,image/png,image/dicom"
                                    : "application/pdf,image/jpeg,image/png"
                                }
                              />
                            </label>
                            <p className="pl-1">or drag and drop</p>
                          </div>
                          <p className="mt-2 text-xs text-muted">
                            {reportType === "image"
                              ? "PNG, JPG, DICOM up to 10MB"
                              : "PDF, PNG, JPG up to 10MB"}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {error && (
                    <div className="mt-4 flex items-start gap-2.5 rounded-lg bg-destructive-100 p-3.5 text-sm text-destructive-700">
                      <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
                      <p>{error}</p>
                    </div>
                  )}

                  <div className="mt-6 flex justify-end gap-3">
                    <button type="button" onClick={resetForm} className="btn btn-secondary">
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isUploading}
                      className="btn btn-primary disabled:opacity-75"
                    >
                      {isUploading ? (
                        <span className="flex items-center">
                          <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                          Analyzing…
                        </span>
                      ) : (
                        "Upload and analyze"
                      )}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        ) : (
          analysisResult && (
            <div className="space-y-6">
              {/* Success banner */}
              <div className="flex items-start gap-3 rounded-xl border border-secondary-200 bg-secondary-50 p-4">
                <CheckCircleIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-secondary-600" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold text-secondary-800">Analysis complete</p>
                  <p className="mt-0.5 text-sm text-secondary-700">
                    Review the plain-language summary below.
                    {savedToRecords ? " A copy was saved to your Medical Records." : ""}
                  </p>
                </div>
              </div>

              {/* Plain-language summary */}
              <section className="card rounded-2xl p-6">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600/10 text-brand-700">
                    <SparklesIcon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h2 className="text-lg font-semibold text-ink">In plain language</h2>
                </div>
                <p className="mt-4 text-base leading-relaxed text-ink">
                  {analysisResult.plainLanguage}
                </p>
                <p className="mt-4 flex items-start gap-2 text-xs text-muted">
                  <ShieldCheckIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-secondary-600" aria-hidden="true" />
                  Written for everyday understanding. Your clinician still reviews the full finding.
                </p>
              </section>

              {/* Technical reading */}
              <section className="card rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-ink">Clinical reading</h2>
                <p className="mt-1 text-xs text-muted">{reportLabel}</p>
                {reportType === "image" ? (
                  <dl className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-xl bg-surface p-4">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Findings</dt>
                      <dd className="mt-1.5 text-sm text-ink">{analysisResult.findings}</dd>
                    </div>
                    <div className="rounded-xl bg-surface p-4">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Impression</dt>
                      <dd className="mt-1.5 text-sm text-ink">{analysisResult.impression}</dd>
                    </div>
                    <div className="rounded-xl bg-surface p-4">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Recommendations</dt>
                      <dd className="mt-1.5 text-sm text-ink">{analysisResult.recommendations}</dd>
                    </div>
                  </dl>
                ) : (
                  <div className="mt-5 space-y-3">
                    {analysisResult.abnormalValues.length > 0 ? (
                      <div className="overflow-x-auto rounded-xl border border-border">
                        <table className="min-w-full divide-y divide-border">
                          <thead className="bg-surface">
                            <tr>
                              {["Parameter", "Value", "Reference range", "Status"].map((h) => (
                                <th
                                  key={h}
                                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted"
                                >
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {analysisResult.abnormalValues.map((item, index) => (
                              <tr key={index}>
                                <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-ink">{item.parameter}</td>
                                <td className="whitespace-nowrap px-4 py-3 text-sm text-ink">{item.value}</td>
                                <td className="whitespace-nowrap px-4 py-3 text-sm text-muted">{item.referenceRange}</td>
                                <td className="whitespace-nowrap px-4 py-3">
                                  <span
                                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                      item.status === "High"
                                        ? "bg-destructive-100 text-destructive-700"
                                        : item.status === "Low"
                                        ? "bg-amber-100 text-amber-800"
                                        : "bg-secondary-100 text-secondary-800"
                                    }`}
                                  >
                                    {item.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="rounded-xl bg-surface p-4 text-sm text-ink">
                        All values are within their normal ranges.
                      </div>
                    )}
                    <div className="rounded-xl bg-surface p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted">Interpretation</p>
                      <p className="mt-1.5 text-sm text-ink">{analysisResult.interpretation}</p>
                    </div>
                    <div className="rounded-xl bg-surface p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted">Recommendations</p>
                      <p className="mt-1.5 text-sm text-ink">{analysisResult.recommendations}</p>
                    </div>
                  </div>
                )}
              </section>

              {/* Explainability panel */}
              <section className="card rounded-2xl p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
                    <ShieldCheckIcon className="h-5 w-5 text-secondary-600" aria-hidden="true" />
                    How Medisynix reached this reading
                  </h2>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                        analysisResult.flagged
                          ? "bg-amber-100 text-amber-800"
                          : "bg-secondary-100 text-secondary-800"
                      }`}
                    >
                      {analysisResult.flagged ? "Flagged for review" : "Routine"}
                    </span>
                    <span className="glass px-2.5 py-1 text-xs font-semibold text-secondary-800">
                      {analysisResult.confidence}% confidence
                    </span>
                  </div>
                </div>

                <div className="mt-5">
                  <div className="flex justify-between text-xs text-muted">
                    <span>Model confidence</span>
                    <span className="font-semibold text-ink">{analysisResult.confidence}%</span>
                  </div>
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${
                        analysisResult.confidence >= 90
                          ? "from-brand-600 to-secondary-500"
                          : "from-secondary-500 to-teal-500"
                      }`}
                      style={{ width: `${analysisResult.confidence}%` }}
                    />
                  </div>
                </div>

                <h3 className="mt-6 text-xs font-semibold uppercase tracking-wide text-muted">
                  Reasoning trace
                </h3>
                <ul className="mt-3 space-y-2.5">
                  {analysisResult.reasoning.map((step, i) => (
                    <li key={i} className="flex items-start gap-2.5 rounded-lg bg-surface p-3 text-sm text-ink">
                      <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-brand-600/10 text-[10px] font-bold text-brand-700">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ul>

                <p className="mt-4 rounded-xl border border-border p-3.5 text-xs leading-relaxed text-muted">
                  This is a sample explanation for the selected test type; the full product would send
                  your file to a medical AI model. It is not a diagnosis and does not replace a
                  radiologist&apos;s or clinician&apos;s formal report. {analysisResult.flagged ? "Values outside the normal band should be discussed with your doctor." : ""}
                </p>
              </section>

              {/* Actions */}
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                <button type="button" onClick={resetForm} className="btn btn-secondary">
                  Upload another report
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/dashboard/patient/records")}
                  className="btn btn-primary"
                >
                  <span className="flex items-center">
                    Open Medical Records
                    <ArrowRightIcon className="ml-2 h-4 w-4" aria-hidden="true" />
                  </span>
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </DashboardLayout>
  );
}