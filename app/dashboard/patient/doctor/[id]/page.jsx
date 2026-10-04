"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "../../../../../contexts/AuthContext";
import Link from "next/link";
import {
  MapPinIcon,
  AcademicCapIcon,
  StarIcon,
  CalendarDaysIcon,
  ClockIcon,
  UserIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ChatBubbleLeftRightIcon,
  PhoneIcon,
  BriefcaseIcon,
  AcademicCapIcon as EducationIcon,
  HeartIcon,
  CurrencyDollarIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";

export default function DoctorProfilePage() {
  const { user } = useAuth();
  const params = useParams();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");

  const [allDoctors, setAllDoctors] = useState([]);

  // Next few weekdays a patient can pick from (the API only supplies time slots)
  const getUpcomingDates = () => {
    const dates = [];
    const day = new Date();
    while (dates.length < 5) {
      day.setDate(day.getDate() + 1);
      if (day.getDay() !== 0 && day.getDay() !== 6) {
        dates.push(day.toLocaleDateString("en-CA")); // local date, not UTC
      }
    }
    return dates;
  };

  useEffect(() => {
    let cancelled = false;
    async function loadDoctor() {
      setLoading(true);
      try {
        const [doctorRes, listRes] = await Promise.all([
          fetch(`/api/doctors/${params.id}`),
          fetch("/api/doctors"),
        ]);
        const doctorResult = await doctorRes.json();
        const listResult = await listRes.json();
        if (cancelled) return;

        if (doctorRes.ok && doctorResult.success) {
          const availableDates = getUpcomingDates();
          setDoctor({
            rating: 0,
            reviews: 0,
            languages: ["English", "Urdu"],
            services: [],
            certifications: [],
            patientReviews: [],
            workingHours: {
              "Monday - Friday": "09:00 AM - 05:00 PM",
              "Saturday - Sunday": "Closed",
            },
            ...doctorResult.data,
            availableDates,
          });
          setSelectedDate(availableDates[0]);
        } else {
          setDoctor(null);
        }
        if (listResult.success) setAllDoctors(listResult.data);
      } catch (error) {
        console.error("Error loading doctor:", error);
        if (!cancelled) setDoctor(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadDoctor();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading doctor profile...</p>
        </div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center py-16">
          <p className="text-xl text-gray-700 mb-4">Doctor not found</p>
          <Link
            href="/dashboard/patient/find-doctor"
            className="inline-flex items-center text-primary-600 hover:text-primary-800"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Find a Doctor
          </Link>
        </div>
      </div>
    );
  }

  // Format date to display in a user-friendly way
  const formatDate = (dateString) => {
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString("en-US", options);
  };

  return (
    <div className="container mx-auto py-8">
      {/* Back Button */}
      <div className="mb-6">
        <Link
          href="/dashboard/patient/find-doctor"
          className="inline-flex items-center text-primary-600 hover:text-primary-800"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Find a Doctor
        </Link>
      </div>

      {/* Doctor Profile Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row items-center md:items-start">
          <div className="mb-6 md:mb-0 md:mr-8">
            <div className="w-40 h-40 bg-gray-200 rounded-full overflow-hidden flex items-center justify-center">
              {doctor.image ? (
                <img
                  src={doctor.image}
                  alt={doctor.name}
                  className="object-cover w-full h-full"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = "none";
                  }}
                />
              ) : (
                <UserIcon className="h-20 w-20 text-gray-400" />
              )}
            </div>
          </div>

          <div className="text-center md:text-left flex-1">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {doctor.name}
            </h1>
            <p className="text-xl text-primary-600 mb-4">{doctor.specialty}</p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-4">
              <div className="flex items-center">
                <MapPinIcon className="h-5 w-5 mr-2 text-primary-600" />
                <span className="text-gray-600">{doctor.location}</span>
              </div>

              <div className="flex items-center">
                <BriefcaseIcon className="h-5 w-5 mr-2 text-primary-600" />
                <span className="text-gray-600">{doctor.hospital}</span>
              </div>

              <div className="flex items-center">
                <AcademicCapIcon className="h-5 w-5 mr-2 text-primary-600" />
                <span className="text-gray-600">
                  {doctor.experience} experience
                </span>
              </div>

              <div className="flex items-center">
                <CurrencyDollarIcon className="h-5 w-5 mr-2 text-primary-600" />
                <span className="text-gray-600">
                  Rs. {doctor.consultationFee} per visit
                </span>
              </div>
            </div>

            <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-4">
              <a
                href={`/dashboard/patient/appointments?doctor=${doctor.id}`}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition inline-flex items-center"
              >
                <CalendarDaysIcon className="h-5 w-5 mr-2" />
                Book Appointment
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Doctor Information */}
        <div className="lg:col-span-2 space-y-8">
          {/* About */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              About {doctor.name}
            </h2>
            <p className="text-gray-700 mb-4">{doctor.about}</p>

            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-800 mb-3">
                Education
              </h3>
              <div className="flex items-start">
                <EducationIcon className="h-5 w-5 text-primary-600 mr-2 mt-1" />
                <p className="text-gray-700">{doctor.education}</p>
              </div>
            </div>

            {doctor.certifications?.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-800 mb-3">
                Certifications
              </h3>
              <ul className="space-y-2">
                {doctor.certifications &&
                  doctor.certifications.map((cert, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircleIcon className="h-5 w-5 text-primary-600 mr-2 mt-1" />
                      <span className="text-gray-700">{cert}</span>
                    </li>
                  ))}
              </ul>
            </div>
            )}

            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-800 mb-3">
                Languages
              </h3>
              <div className="flex flex-wrap gap-2">
                {doctor.languages &&
                  doctor.languages.map((language, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm"
                    >
                      {language}
                    </span>
                  ))}
              </div>
            </div>
          </div>

          {/* Services */}
          {doctor.services?.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Services</h2>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {doctor.services &&
                doctor.services.map((service, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircleIcon className="h-5 w-5 text-primary-600 mr-2 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">{service}</span>
                  </li>
                ))}
            </ul>
          </div>
          )}

          {/* Working Hours */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Working Hours
            </h2>
            <div className="space-y-3">
              {doctor.workingHours &&
                Object.entries(doctor.workingHours).map(
                  ([day, hours], index) => (
                    <div
                      key={index}
                      className="flex justify-between pb-2 border-b border-gray-100"
                    >
                      <span className="text-gray-700 font-medium">{day}</span>
                      <span className="text-gray-600">{hours}</span>
                    </div>
                  )
                )}
            </div>
          </div>

        </div>

        {/* Right Column - Booking Widget */}
        <div className="space-y-8">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Book an Appointment
            </h2>

            {/* Date Selection */}
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">
                Select Date
              </label>
              <div className="grid grid-cols-1 gap-2">
                {doctor.availableDates &&
                  doctor.availableDates.map((date) => (
                    <button
                      key={date}
                      type="button"
                      className={`flex justify-between items-center px-4 py-3 border rounded-md ${
                        selectedDate === date
                          ? "bg-primary-50 border-primary-600 text-primary-700"
                          : "border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                      onClick={() => setSelectedDate(date)}
                    >
                      <span>{formatDate(date)}</span>
                      {selectedDate === date && (
                        <CheckCircleIcon className="h-5 w-5 text-primary-600" />
                      )}
                    </button>
                  ))}
              </div>
            </div>

            {/* Time Slot Selection */}
            {selectedDate && (
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">
                  Select Time
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {doctor.availableTimeSlots &&
                    doctor.availableTimeSlots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        className={`px-4 py-2 border rounded-md text-center ${
                          selectedTimeSlot === slot
                            ? "bg-primary-50 border-primary-600 text-primary-700"
                            : "border-gray-300 text-gray-700 hover:bg-gray-50"
                        }`}
                        onClick={() => setSelectedTimeSlot(slot)}
                      >
                        {slot}
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* Booking Button */}
            <div className="mt-6">
              {selectedDate && selectedTimeSlot ? (
                <a
                  href={`/dashboard/patient/appointments?doctor=${doctor.id}&date=${selectedDate}&time=${encodeURIComponent(selectedTimeSlot)}`}
                  className="block w-full rounded-md bg-primary-600 px-4 py-3 text-center text-white transition hover:bg-primary-700"
                >
                  Book Appointment
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  className="block w-full cursor-not-allowed rounded-md bg-gray-300 px-4 py-3 text-center text-white"
                >
                  Select a date and time
                </button>
              )}
              <p className="text-center mt-3 text-sm text-gray-500">
                Consultation Fee: Rs. {doctor.consultationFee}
              </p>
            </div>

          </div>

          {/* Similar Doctors */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Similar Doctors
            </h2>
            <div className="space-y-4">
              {allDoctors
                .filter(
                  (d) => d.specialty === doctor.specialty && d.id !== doctor.id
                )
                .slice(0, 3)
                .map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-start pb-4 border-b border-gray-100 last:border-0 last:pb-0"
                  >
                    <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden flex-shrink-0 mr-3">
                      {doc.image ? (
                        <img
                          src={doc.image}
                          alt={doc.name}
                          className="object-cover w-full h-full"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.style.display = "none";
                          }}
                        />
                      ) : (
                        <UserIcon className="h-8 w-8 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-gray-800 font-medium">{doc.name}</h3>
                      <p className="text-gray-600 text-sm">{doc.specialty}</p>
                      <a
                        href={`/dashboard/patient/doctor/${doc.id}`}
                        className="text-primary-600 hover:text-primary-800 text-sm font-medium mt-2 inline-block"
                      >
                        View Profile
                      </a>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
