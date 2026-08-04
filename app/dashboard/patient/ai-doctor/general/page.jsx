"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

const CHATBASE_AGENT_ID = "j2fgtClSFXZi_k4qdHnv7";

export default function GeneralAIDoctorPage() {
  const router = useRouter();

  // Verify doctor token
  useEffect(() => {
    const doctorToken = localStorage.getItem('doctorToken');
    if (!doctorToken) {
      router.push('/dashboard/patient/ai-doctor');
      return;
    }
    try {
      const payload = JSON.parse(atob(doctorToken.split('.')[1]));
      if (payload.doctorType !== 'general') {
        router.push('/dashboard/patient/ai-doctor');
      }
    } catch {
      localStorage.removeItem('doctorToken');
      router.push('/dashboard/patient/ai-doctor');
    }
  }, [router]);

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
        <div className="flex items-center text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
          <InformationCircleIcon className="h-4 w-4 mr-1" />
          General AI Doctor
        </div>
      </div>

      {/* Chatbase Iframe */}
      <div className="flex-1 rounded-xl overflow-hidden border border-gray-200 shadow-lg bg-white relative">
        <iframe
          src={`https://www.chatbase.co/chatbot-iframe/${CHATBASE_AGENT_ID}`}
          width="100%"
          style={{ height: '100%', minHeight: '700px' }}
          frameBorder="0"
          allow="microphone"
          title="General AI Doctor"
        />
      </div>

      {/* Disclaimer */}
      <div className="mt-4 bg-gray-50 rounded-lg p-3 text-xs text-gray-500">
        <p className="font-medium mb-1">Disclaimer:</p>
        <p>
          The information provided by the AI Doctor is for educational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider.
        </p>
      </div>
    </div>
  );
}