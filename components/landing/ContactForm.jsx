"use client";

import { useState } from "react";
import { CheckCircleIcon, ExclamationCircleIcon } from "@heroicons/react/24/outline";

const MESSAGE_MAX = 2000;

const inputClass =
  "block w-full rounded-lg border-0 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm ring-1 ring-inset transition placeholder:text-gray-400 focus:ring-2 focus:ring-inset";

const ringFor = (hasError) =>
  hasError ? "ring-red-300 focus:ring-red-500" : "ring-gray-300 focus:ring-primary-600";

export default function ContactForm() {
  const [values, setValues] = useState({ name: "", email: "", subject: "", message: "", website: "" });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | sending | sent | failed
  const [serverError, setServerError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const next = {};
    if (values.name.trim().length < 2) next.name = "Please enter your name";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) next.email = "Please enter a valid email address";
    if (values.message.trim().length < 10) next.message = "Please write at least 10 characters";
    return next;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const next = validate();
    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }

    setStatus("sending");
    setServerError("");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Something went wrong. Please try again.");
      }
      setStatus("sent");
      setValues({ name: "", email: "", subject: "", message: "", website: "" });
    } catch (error) {
      setServerError(error.message || "Something went wrong. Please try again.");
      setStatus("failed");
    }
  };

  if (status === "sent") {
    return (
      <div className="flex min-h-[22rem] flex-col items-center justify-center rounded-2xl bg-white p-8 text-center shadow-card ring-1 ring-gray-200">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-50 text-accent-600">
          <CheckCircleIcon className="h-8 w-8" aria-hidden="true" />
        </span>
        <h3 className="mt-5 text-xl font-semibold text-gray-900">Message sent</h3>
        <p className="mt-2 max-w-sm text-sm leading-6 text-gray-600" role="status">
          Thanks for reaching out. We&apos;ve received your message and will reply by email.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="btn btn-secondary mt-6 !py-2 text-sm"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-gray-200 sm:p-8"
    >
      {status === "failed" && (
        <div role="alert" className="mb-5 flex items-start gap-3 rounded-lg bg-red-50 p-3.5 ring-1 ring-inset ring-red-200">
          <ExclamationCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-red-500" aria-hidden="true" />
          <p className="text-sm text-red-700">{serverError}</p>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="block text-sm font-medium text-gray-900">
            Name
          </label>
          <input
            id="contact-name"
            name="name"
            type="text"
            autoComplete="name"
            value={values.name}
            onChange={handleChange}
            placeholder="Your name"
            maxLength={100}
            className={`mt-2 ${inputClass} ${ringFor(errors.name)}`}
          />
          {errors.name && <p className="mt-1.5 text-sm text-red-600">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="contact-email" className="block text-sm font-medium text-gray-900">
            Email
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={handleChange}
            placeholder="you@example.com"
            maxLength={200}
            className={`mt-2 ${inputClass} ${ringFor(errors.email)}`}
          />
          {errors.email && <p className="mt-1.5 text-sm text-red-600">{errors.email}</p>}
        </div>
      </div>

      <div className="mt-5">
        <label htmlFor="contact-subject" className="block text-sm font-medium text-gray-900">
          Subject <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <input
          id="contact-subject"
          name="subject"
          type="text"
          value={values.subject}
          onChange={handleChange}
          placeholder="How can we help?"
          maxLength={120}
          className={`mt-2 ${inputClass} ${ringFor(false)}`}
        />
      </div>

      <div className="mt-5">
        <div className="flex items-baseline justify-between">
          <label htmlFor="contact-message" className="block text-sm font-medium text-gray-900">
            Message
          </label>
          <span className="text-xs text-gray-400">
            {values.message.length}/{MESSAGE_MAX}
          </span>
        </div>
        <textarea
          id="contact-message"
          name="message"
          rows={5}
          value={values.message}
          onChange={handleChange}
          placeholder="Tell us a little about your question or feedback..."
          maxLength={MESSAGE_MAX}
          className={`mt-2 resize-y ${inputClass} ${ringFor(errors.message)}`}
        />
        {errors.message && <p className="mt-1.5 text-sm text-red-600">{errors.message}</p>}
      </div>

      {/* Honeypot: hidden from people, tempting to bots */}
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
        <label htmlFor="contact-website">Website</label>
        <input
          id="contact-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={values.website}
          onChange={handleChange}
        />
      </div>

      <button
        type="submit"
        disabled={status === "sending"}
        className="btn btn-primary mt-6 w-full disabled:cursor-not-allowed disabled:opacity-75"
      >
        {status === "sending" ? "Sending..." : "Send message"}
      </button>
      <p className="mt-3 text-center text-xs text-gray-500">
        We only use your details to reply to this message.
      </p>
    </form>
  );
}
