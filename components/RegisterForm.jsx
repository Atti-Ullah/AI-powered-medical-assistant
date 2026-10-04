"use client";

import { useState } from "react";
import Link from "next/link";
import {
  EnvelopeIcon,
  ExclamationCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  InformationCircleIcon,
  LockClosedIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../contexts/AuthContext";

const baseInputClass =
  "block w-full rounded-lg border-0 bg-white py-2.5 text-sm text-gray-900 shadow-sm ring-1 ring-inset transition placeholder:text-gray-400 focus:ring-2 focus:ring-inset";

const inputClass = (hasError) =>
  `${baseInputClass} ${
    hasError
      ? "ring-red-300 focus:ring-red-500"
      : "ring-gray-300 focus:ring-primary-600"
  }`;

function FieldError({ children }) {
  if (!children) return null;
  return <p className="mt-1.5 text-sm text-red-600">{children}</p>;
}

function PasswordInput({ id, name, value, onChange, hasError, placeholder }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative mt-2">
      <LockClosedIcon
        className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
        aria-hidden="true"
      />
      <input
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        autoComplete="new-password"
        required
        className={`${inputClass(hasError)} pl-10 pr-11`}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 flex items-center rounded-r-lg pr-3 text-gray-400 hover:text-gray-600 focus-visible:outline-none focus-visible:text-primary-600"
      >
        {visible ? (
          <EyeSlashIcon className="h-5 w-5" aria-hidden="true" />
        ) : (
          <EyeIcon className="h-5 w-5" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}

export default function RegisterForm() {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    userType: "patient", // Default to patient
    agreeToTerms: false,
  });

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });

    // Clear errors when user types
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: "",
      });
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.firstName.trim()) {
      errors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      errors.lastName = "Last name is required";
    }

    if (!formData.email) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Email is invalid";
    }

    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters long";
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    if (!formData.agreeToTerms) {
      errors.agreeToTerms = "You must agree to the terms and conditions";
    }

    if (!/[a-z]/.test(formData.password)) {
      errors.lowerCase = "At least one lowercase letter required.";
    }
    if (!/[A-Z]/.test(formData.password)) {
      errors.upperCase = "At least one uppercase letter required.";
    }
    if (!/[0-9]/.test(formData.password)) {
      errors.number = "At least one number required.";
    }
    if (!/[\W_]/.test(formData.password)) {
      errors.specialCharacter = "At least one special character required.";
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validateForm();

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      // Use the new API endpoint path
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          userType: formData.userType,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }
      // Login the user with the returned data
      login({
        id: data.data.id,
        email: data.data.email,
        name: data.data.name,
        type: data.data.type,
        token: data.data.token,
      });
    } catch (error) {
      setFormErrors({
        general: error.message || "Registration failed. Please try again.",
      });
      setIsSubmitting(false);
    }
  };

  // Only the first unmet password rule is shown at a time
  const passwordError =
    formErrors.password ||
    formErrors.lowerCase ||
    formErrors.upperCase ||
    formErrors.number ||
    formErrors.specialCharacter;

  return (
    <div className="flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-12">
      <div>
        <h1 className="text-[1.75rem] font-bold leading-tight tracking-tight text-gray-900">
          Create your account
        </h1>
        <p className="mt-2 text-sm leading-6 text-gray-600">
          Join Medisynix in a minute. It&apos;s free for patients.
        </p>
      </div>

      {formErrors.general && (
        <div
          role="alert"
          className="mt-6 flex items-start gap-3 rounded-lg bg-red-50 p-3.5 ring-1 ring-inset ring-red-200"
        >
          <ExclamationCircleIcon
            className="mt-0.5 h-5 w-5 shrink-0 text-red-500"
            aria-hidden="true"
          />
          <p className="text-sm text-red-700">{formErrors.general}</p>
        </div>
      )}

      <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="firstName"
              className="block text-sm font-medium leading-6 text-gray-900"
            >
              First name
            </label>
            <div className="relative mt-2">
              <UserIcon
                className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
                aria-hidden="true"
              />
              <input
                type="text"
                name="firstName"
                id="firstName"
                autoComplete="given-name"
                className={`${inputClass(formErrors.firstName)} pl-10 pr-3`}
                placeholder="First name"
                value={formData.firstName}
                onChange={handleChange}
              />
            </div>
            <FieldError>{formErrors.firstName}</FieldError>
          </div>

          <div>
            <label
              htmlFor="lastName"
              className="block text-sm font-medium leading-6 text-gray-900"
            >
              Last name
            </label>
            <div className="relative mt-2">
              <UserIcon
                className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
                aria-hidden="true"
              />
              <input
                type="text"
                name="lastName"
                id="lastName"
                autoComplete="family-name"
                className={`${inputClass(formErrors.lastName)} pl-10 pr-3`}
                placeholder="Last name"
                value={formData.lastName}
                onChange={handleChange}
              />
            </div>
            <FieldError>{formErrors.lastName}</FieldError>
          </div>
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium leading-6 text-gray-900"
          >
            Email address
          </label>
          <div className="relative mt-2">
            <EnvelopeIcon
              className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
              aria-hidden="true"
            />
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className={`${inputClass(formErrors.email)} pl-10 pr-3`}
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
          <FieldError>{formErrors.email}</FieldError>
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium leading-6 text-gray-900"
          >
            Password
          </label>
          <PasswordInput
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            hasError={!!passwordError}
            placeholder="Create a password"
          />
          {passwordError ? (
            <FieldError>{passwordError}</FieldError>
          ) : (
            <p className="mt-1.5 text-xs text-gray-500">
              Use 8+ characters with upper and lower case letters, a number and
              a symbol.
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium leading-6 text-gray-900"
          >
            Confirm password
          </label>
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            hasError={!!formErrors.confirmPassword}
            placeholder="Re-enter your password"
          />
          <FieldError>{formErrors.confirmPassword}</FieldError>
        </div>

        <div className="flex items-start gap-3 rounded-lg bg-primary-50 p-3.5 ring-1 ring-inset ring-primary-100">
          <InformationCircleIcon
            className="mt-0.5 h-5 w-5 shrink-0 text-primary-600"
            aria-hidden="true"
          />
          <p className="text-sm leading-5 text-primary-900">
            You are registering as a patient. Doctor and administrator accounts
            are created by the Medisynix admin team.
          </p>
        </div>

        <div>
          <div className="flex items-start">
            <input
              id="agreeToTerms"
              name="agreeToTerms"
              type="checkbox"
              className={`mt-1 h-4 w-4 rounded text-primary-600 focus:ring-primary-600 ${
                formErrors.agreeToTerms ? "border-red-400" : "border-gray-300"
              }`}
              checked={formData.agreeToTerms}
              onChange={handleChange}
            />
            <label
              htmlFor="agreeToTerms"
              className="ml-2.5 block text-sm leading-6 text-gray-700"
            >
              I agree to the{" "}
              <a
                href="#"
                className="font-semibold text-primary-600 hover:text-primary-500"
              >
                Terms
              </a>{" "}
              and{" "}
              <a
                href="#"
                className="font-semibold text-primary-600 hover:text-primary-500"
              >
                Privacy Policy
              </a>
            </label>
          </div>
          <FieldError>{formErrors.agreeToTerms}</FieldError>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-3 py-2.5 text-sm font-semibold text-white shadow-raised transition hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:cursor-not-allowed disabled:opacity-75"
        >
          {isSubmitting && (
            <svg
              className="h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
          )}
          {isSubmitting ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-gray-600">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-primary-600 hover:text-primary-500"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
