"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import {
  ArrowLeftIcon,
  InformationCircleIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

const CHATBASE_AGENT_ID = "j2fgtClSFXZi_k4qdHnv7";

export default function GeneralAIDoctorPage() {
  const router = useRouter();

  // Used to reload the Chatbase iframe
  // when the user clicks "Start New Chat"
  const [chatKey, setChatKey] = useState(0);

  // Verify doctor token
  useEffect(() => {
    const doctorToken = localStorage.getItem("doctorToken");

    if (!doctorToken) {
      router.push("/dashboard/patient/ai-doctor");
      return;
    }

    try {
      const payload = JSON.parse(atob(doctorToken.split(".")[1]));

      if (payload.doctorType !== "general") {
        router.push("/dashboard/patient/ai-doctor");
        return;
      }
    } catch {
      localStorage.removeItem("doctorToken");
      router.push("/dashboard/patient/ai-doctor");
    }
  }, [router]);

  // Start a fresh Chatbase session
  const startNewChat = () => {
    setChatKey((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">

        {/* Top Navigation */}
        <div className="flex items-center justify-between mb-5">

          {/* Back to Selection */}
          <Link
            href="/dashboard/patient/ai-doctor"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
          >
            <ArrowLeftIcon className="h-5 w-5" />

            <span className="text-sm font-medium">
              Back to Selection
            </span>
          </Link>

          {/* General AI Doctor Badge */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 border border-green-200">
            <span className="h-2.5 w-2.5 rounded-full bg-green-500" />

            <InformationCircleIcon className="h-4 w-4 text-green-600" />

            <span className="text-sm font-medium text-green-700">
              General AI Doctor
            </span>
          </div>
        </div>

        {/* Chat Section */}
        <div className="rounded-xl overflow-hidden border border-gray-200 shadow-lg bg-white">

          {/* Chat Controls */}
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

          {/* Chatbase Iframe */}
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
            title="General AI Doctor"
          />

        </div>

        {/* Disclaimer */}
        <div className="mt-4 mb-6 bg-gray-50 rounded-lg p-3 text-xs text-gray-500">

          <p className="font-medium mb-1">
            Disclaimer:
          </p>

          <p>
            The information provided by the AI Doctor is for educational
            purposes only and is not a substitute for professional medical
            advice, diagnosis, or treatment. Always seek the advice of your
            physician or other qualified healthcare provider.
          </p>

        </div>

      </div>
    </div>
  );
}