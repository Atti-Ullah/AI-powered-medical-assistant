"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../../../contexts/AuthContext";
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  AcademicCapIcon,
  StarIcon,
  CalendarDaysIcon,
  ClockIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

export default function FindDoctorPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");

  // List of medical specialties
  const specialties = [
    "Cardiologist",
    "Dermatologist",
    "Endocrinologist",
    "Gastroenterologist",
    "General Physician",
    "Neurologist",
    "Obstetrician/Gynecologist",
    "Ophthalmologist",
    "Orthopedic Surgeon",
    "Pediatrician",
    "Psychiatrist",
    "Urologist",
  ];

  // List of locations
  const locations = [
    "Islamabad",
    "Lahore",
    "Karachi",
    "Peshawar",
    "Quetta",
    "Multan",
    "Faisalabad",
    "Rawalpindi",
  ];

  useEffect(() => {
    let cancelled = false;
    async function loadDoctors() {
      try {
        const response = await fetch("/api/doctors");
        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.message || "Failed to load doctors");
        }
        if (!cancelled) setDoctors(result.data);
      } catch (error) {
        console.error("Error loading doctors:", error);
        if (!cancelled) setLoadError("Could not load doctors. Please try again later.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadDoctors();
    return () => {
      cancelled = true;
    };
  }, []);

  // Filter doctors based on search, specialty, and location
  useEffect(() => {
    let results = doctors;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(
        (doctor) =>
          doctor.name.toLowerCase().includes(query) ||
          doctor.specialty.toLowerCase().includes(query) ||
          doctor.hospital.toLowerCase().includes(query)
      );
    }

    if (selectedSpecialty) {
      results = results.filter(
        (doctor) => doctor.specialty === selectedSpecialty
      );
    }

    if (selectedLocation) {
      results = results.filter(
        (doctor) => doctor.location === selectedLocation
      );
    }

    setFilteredDoctors(results);
  }, [searchQuery, selectedSpecialty, selectedLocation, doctors]);

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Find a Doctor</h1>

      {/* Search and Filter Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-600 focus:border-primary-600 sm:text-sm"
              placeholder="Search by name, specialty, or hospital"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Specialty Filter */}
          <div>
            <select
              className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-600 focus:border-primary-600 sm:text-sm"
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
            >
              <option value="">All Specialties</option>
              {specialties.map((specialty) => (
                <option key={specialty} value={specialty}>
                  {specialty}
                </option>
              ))}
            </select>
          </div>

          {/* Location Filter */}
          <div>
            <select
              className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-600 focus:border-primary-600 sm:text-sm"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
            >
              <option value="">All Locations</option>
              {locations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Doctor Listing */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 bg-primary-100">
          <h2 className="text-xl font-bold text-primary-800">
            Available Doctors
          </h2>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-500">Loading doctors...</p>
            </div>
          ) : filteredDoctors.length > 0 ? (
            <div className="space-y-6">
              {filteredDoctors.map((doctor) => (
                <div
                  key={doctor.id}
                  className="border rounded-lg p-6 hover:shadow-md transition"
                >
                  <div className="flex flex-col md:flex-row">
                    {/* Doctor Image and Basic Info */}
                    <div className="md:w-1/4 flex flex-col items-center md:items-start mb-4 md:mb-0">
                      <div className="w-32 h-32 bg-gray-200 rounded-full overflow-hidden flex items-center justify-center mb-4">
                        {doctor.image ? (
                          <img
                            src={doctor.image}
                            alt={doctor.name}
                            className="object-cover w-full h-full"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src =
                                "https://via.placeholder.com/150?text=Doctor";
                            }}
                          />
                        ) : (
                          <UserIcon className="h-16 w-16 text-gray-400" />
                        )}
                      </div>

                      {doctor.rating ? (
                        <div className="flex items-center mb-2">
                          {[...Array(5)].map((_, i) => (
                            <StarIcon
                              key={i}
                              className={`h-5 w-5 ${
                                i < Math.floor(doctor.rating)
                                  ? "text-yellow-400 fill-current"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                          <span className="ml-2 text-sm text-gray-600">
                            ({doctor.reviews || 0} reviews)
                          </span>
                        </div>
                      ) : null}

                      <a
                        href={`/dashboard/patient/doctor/${doctor.id}`}
                        className="mt-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition text-center w-full"
                      >
                        View Profile
                      </a>
                    </div>

                    {/* Doctor Details */}
                    <div className="md:w-2/4 md:pl-6">
                      <h3 className="text-xl font-bold text-gray-800 mb-2">
                        {doctor.name}
                      </h3>
                      <p className="text-gray-600 mb-4">{doctor.specialty}</p>

                      <div className="mb-2 flex items-center">
                        <MapPinIcon className="h-5 w-5 mr-2 text-primary-600" />
                        <span className="text-gray-600">
                          {doctor.location} - {doctor.hospital}
                        </span>
                      </div>

                      <div className="mb-2 flex items-center">
                        <AcademicCapIcon className="h-5 w-5 mr-2 text-primary-600" />
                        <span className="text-gray-600">
                          {doctor.experience} experience
                        </span>
                      </div>

                      <div className="mb-4 flex items-center">
                        <CalendarDaysIcon className="h-5 w-5 mr-2 text-primary-600" />
                        <span className="text-gray-600">
                          Next Available:{" "}
                          {new Date(doctor.nextAvailable).toLocaleDateString()}
                        </span>
                      </div>

                      <p className="text-gray-700 line-clamp-3">
                        {doctor.about}
                      </p>
                    </div>

                    {/* Booking Section */}
                    <div className="md:w-1/4 mt-4 md:mt-0 md:pl-6 border-l">
                      <p className="text-lg font-bold text-gray-800 mb-2">
                        Rs. {doctor.consultationFee}
                        <span className="text-sm font-normal text-gray-500">
                          {" "}
                          per visit
                        </span>
                      </p>

                      <p className="text-sm text-gray-600 mb-3">
                        Available Time Slots:
                      </p>

                      <div className="grid grid-cols-2 gap-2 mb-4">
                        {doctor.availableTimeSlots
                          .slice(0, 4)
                          .map((slot, index) => (
                            <div
                              key={index}
                              className="px-2 py-1 text-xs border border-primary-200 rounded text-primary-600 bg-primary-50 text-center"
                            >
                              {slot}
                            </div>
                          ))}
                      </div>

                      <a
                        href={`/dashboard/patient/appointments?doctor=${doctor.id}`}
                        className="block w-full px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition text-center"
                      >
                        Book Appointment
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              {loadError && <p className="text-red-600 mb-2">{loadError}</p>}
              <p className="text-gray-500">
                No doctors found matching your criteria. Please try different
                filters.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
