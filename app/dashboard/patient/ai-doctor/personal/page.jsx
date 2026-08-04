"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  UserCircleIcon,
  PencilIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

const CHATBASE_AGENT_ID = "j2fgtClSFXZi_k4qdHnv7";

export default function PersonalAIDoctorPage() {
  const router = useRouter();
  const [healthData, setHealthData] = useState(null);
  const [loadingHealth, setLoadingHealth] = useState(true);

  // Verify token + load health data
  useEffect(() => {
    const doctorToken = localStorage.getItem('doctorToken');
    if (!doctorToken) {
      router.push('/dashboard/patient/ai-doctor');
      return;
    }
    try {
      const payload = JSON.parse(atob(doctorToken.split('.')[1]));
      if (payload.doctorType !== 'personal') {
        router.push('/dashboard/patient/ai-doctor');
        return;
      }
    } catch {
      localStorage.removeItem('doctorToken');
      router.push('/dashboard/patient/ai-doctor');
      return;
    }

    fetchHealthData();
  }, [router]);

  const fetchHealthData = async () => {
    try {
      const doctorToken = localStorage.getItem('doctorToken');
      const res = await fetch('/api/doctor/health-data', {
        headers: { Authorization: `Bearer ${doctorToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setHealthData(data.healthData);
      }
    } catch (e) {
      console.log('Health data fetch failed:', e);
    } finally {
      setLoadingHealth(false);
    }
  };

  return (
    <div className="container mx-auto py-6 px-4 h-screen flex flex-col max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Link
          href="/dashboard/patient/ai-doctor"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Selection
        </Link>
        <div className="flex items-center text-sm font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full">
          <ShieldCheckIcon className="h-4 w-4 mr-1" />
          Personal AI Doctor
        </div>
      </div>

      {/* Health Profile Banner */}
      {!loadingHealth && healthData && (
        <div className="mb-3 bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-green-800 flex items-center">
              <UserCircleIcon className="h-4 w-4 mr-1" />
              Your Health Profile — Mention these details to the AI Doctor:
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {healthData.age && (
              <span className="text-xs bg-white text-green-700 px-2 py-1 rounded-full border border-green-200">
                Age: {healthData.age}
              </span>
            )}
            {healthData.gender && (
              <span className="text-xs bg-white text-green-700 px-2 py-1 rounded-full border border-green-200">
                Gender: {healthData.gender}
              </span>
            )}
            {healthData.conditions?.length > 0 && (
              <span className="text-xs bg-white text-green-700 px-2 py-1 rounded-full border border-green-200">
                Conditions: {healthData.conditions.join(', ')}
              </span>
            )}
            {healthData.medications?.length > 0 && (
              <span className="text-xs bg-white text-green-700 px-2 py-1 rounded-full border border-green-200">
                Medications: {healthData.medications.join(', ')}
              </span>
            )}
            {healthData.allergies?.length > 0 && (
              <span className="text-xs bg-white text-green-700 px-2 py-1 rounded-full border border-green-200">
                Allergies: {healthData.allergies.join(', ')}
              </span>
            )}
            {!healthData.age && !healthData.gender && (
              <span className="text-xs text-green-600 italic">
                No health data saved yet. Update your profile below.
              </span>
            )}
          </div>
        </div>
      )}

      {/* Chatbase Iframe */}
      <div className="flex-1 rounded-xl overflow-hidden border border-gray-200 shadow-lg bg-white relative">
        <iframe
          src={`https://www.chatbase.co/chatbot-iframe/${CHATBASE_AGENT_ID}`}
          width="100%"
          style={{ height: '100%', minHeight: '700px' }}
          frameBorder="0"
          allow="microphone"
          title="Personal AI Doctor"
        />
      </div>

      {/* Disclaimer */}
      <div className="mt-4 bg-gray-50 rounded-lg p-3 text-xs text-gray-500">
        <p className="font-medium mb-1">Disclaimer:</p>
        <p>
          This AI Doctor is for educational purposes only. Always consult a qualified physician for medical decisions.
        </p>
      </div>
    </div>
  );
}