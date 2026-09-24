"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import {
  ArrowLeftIcon,
  UserCircleIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

const CHATBASE_AGENT_ID = "Tan2AeZrBeCu_jAYjK2tT";

export default function PersonalAIDoctorPage() {
  const router = useRouter();

  const [healthData, setHealthData] = useState(null);
  const [loadingHealth, setLoadingHealth] = useState(true);

  // Used to reload the Chatbase iframe
  // when the user clicks "Start New Chat"
  const [chatKey, setChatKey] = useState(0);

  // Verify token + load health data
  useEffect(() => {
    const doctorToken = localStorage.getItem("doctorToken");

    if (!doctorToken) {
      router.push("/dashboard/patient/ai-doctor");
      return;
    }

    try {
      const payload = JSON.parse(atob(doctorToken.split(".")[1]));

      if (payload.doctorType !== "personal") {
        router.push("/dashboard/patient/ai-doctor");
        return;
      }
    } catch {
      localStorage.removeItem("doctorToken");
      router.push("/dashboard/patient/ai-doctor");
      return;
    }

    fetchHealthData();
  }, [router]);

  // Fetch patient's health profile
  const fetchHealthData = async () => {
    try {
      const doctorToken = localStorage.getItem("doctorToken");

      const res = await fetch("/api/doctor/health-data", {
        headers: {
          Authorization: `Bearer ${doctorToken}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setHealthData(data.healthData);
      }
    } catch (e) {
      console.log("Health data fetch failed:", e);
    } finally {
      setLoadingHealth(false);
    }
  };

  // Start a fresh Chatbase session
  const startNewChat = () => {
    setChatKey((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Top navigation */}
        <div className="flex items-center justify-between mb-5">
          {/* Back */}
          <Link
            href="/dashboard/patient/ai-doctor"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
          >
            <ArrowLeftIcon className="h-5 w-5" />

            <span className="text-sm font-medium">
              Back to Selection
            </span>
          </Link>

          {/* Personal AI Doctor badge */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 border border-green-200">
            <span className="h-2.5 w-2.5 rounded-full bg-green-500" />

            <span className="text-sm font-medium text-green-700">
              Personal AI Doctor
            </span>
          </div>
        </div>

        {/* Health Profile Banner */}
        {!loadingHealth && (
          <div className="mb-5 bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center mb-2">
              <p className="text-sm font-medium text-green-800 flex items-center">
                <UserCircleIcon className="h-5 w-5 mr-2" />

                Your Health Profile — Mention these details to the AI Doctor:
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {healthData?.age && (
                <span className="text-xs bg-white text-green-700 px-3 py-1.5 rounded-full border border-green-200">
                  Age: {healthData.age}
                </span>
              )}

              {healthData?.gender && (
                <span className="text-xs bg-white text-green-700 px-3 py-1.5 rounded-full border border-green-200">
                  Gender: {healthData.gender}
                </span>
              )}

              {healthData?.conditions?.length > 0 && (
                <span className="text-xs bg-white text-green-700 px-3 py-1.5 rounded-full border border-green-200">
                  Conditions: {healthData.conditions.join(", ")}
                </span>
              )}

              {healthData?.medications?.length > 0 && (
                <span className="text-xs bg-white text-green-700 px-3 py-1.5 rounded-full border border-green-200">
                  Medications: {healthData.medications.join(", ")}
                </span>
              )}

              {healthData?.allergies?.length > 0 && (
                <span className="text-xs bg-white text-green-700 px-3 py-1.5 rounded-full border border-green-200">
                  Allergies: {healthData.allergies.join(", ")}
                </span>
              )}

              {!healthData?.age &&
                !healthData?.gender &&
                !healthData?.conditions?.length &&
                !healthData?.medications?.length &&
                !healthData?.allergies?.length && (
                  <span className="text-sm text-green-600 italic">
                    No health data saved yet. Update your profile below.
                  </span>
                )}
            </div>
          </div>
        )}

        {/* Chat Section */}
        <div className="rounded-xl overflow-hidden border border-gray-200 shadow-lg bg-white">
          
          {/* Custom Chat Controls */}
          <div className="flex items-center justify-end px-4 py-3 border-b border-gray-200 bg-white">
            <button
              type="button"
              onClick={startNewChat}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition duration-200"
              title="Start a new chat"
            >
              <ArrowPathIcon className="h-4 w-4" />

              <span>Start New Chat</span>
            </button>
          </div>

          {/* Chatbase */}
          <iframe
            key={chatKey}
            src={`https://www.chatbase.co/chatbot-iframe/${CHATBASE_AGENT_ID}`}
            width="100%"
            style={{
              height: "520px",
              border: "none",
              display: "block",
            }}
            allow="microphone"
            title="Personal AI Doctor"
          />
        </div>

        {/* Disclaimer */}
        <div className="mt-4 mb-6 bg-gray-50 rounded-lg p-3 text-xs text-gray-500">
          <p className="font-medium mb-1">
            Disclaimer:
          </p>

          <p>
            This AI Doctor is for educational purposes only. Always consult
            a qualified physician for medical decisions.
          </p>
        </div>
      </div>
    </div>
  );
}