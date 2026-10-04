"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../contexts/AuthContext';
import Link from 'next/link';
import Image from 'next/image';
import {
  CheckIcon,
  ArrowRightIcon,
  UserCircleIcon,
  LockClosedIcon,
  ClipboardDocumentCheckIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

export default function AIDoctorSelectionPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [error, setError] = useState('');

  const handleDoctorSelect = async (doctorType) => {
    setIsLoading(true);
    setError('');
    setSelectedDoctor(doctorType);

    try {
      // Call the backend API to initialize the doctor session
      const response = await fetch('/api/doctor/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        },
        // The server takes the user ID from the login token
        body: JSON.stringify({ doctorType }),
      });

      const data = await response.json();
      
      if (response.ok) {
        // Store the doctor session token
        localStorage.setItem('doctorToken', data.token);
        
        // Redirect to the appropriate chat interface
        router.push(`/dashboard/patient/ai-doctor/${doctorType}`);
      } else {
        console.error('Error initializing doctor session:', data.message);
        setError(data.message || data.error || 'We could not start the session. Please try again.');
      }
    } catch (error) {
      console.error('Error selecting doctor:', error);
      setError('We could not start the session. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">AI Doctor</h1>
      <p className="text-gray-600 mb-8">Choose which AI doctor you'd like to consult with</p>

      {error && (
        <div role="alert" className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        {/* General AI Doctor */}
        <div 
          className={`bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer border-2 ${
            selectedDoctor === 'general' ? 'border-primary-500' : 'border-transparent'
          }`}
          onClick={() => handleDoctorSelect('general')}
        >
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <ChatBubbleLeftRightIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h2 className="text-xl font-bold text-gray-800">General AI Doctor</h2>
                  <p className="text-primary-600">Quick Medical Guidance</p>
                </div>
              </div>
              {selectedDoctor === 'general' && (
                <CheckIcon className="h-6 w-6 text-primary-600" />
              )}
            </div>

            <div className="mt-6">
              <p className="text-gray-600 mb-4">
                Get general health information and guidance without sharing personal medical history.
                Ideal for quick questions and basic health inquiries.
              </p>

              <div className="space-y-3 mt-6">
                <div className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="ml-3 text-gray-600">Your health profile is not shared with this assistant</p>
                </div>
                <div className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="ml-3 text-gray-600">Ask about symptoms, hospitals and services</p>
                </div>
                <div className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="ml-3 text-gray-600">General health information</p>
                </div>
                <div className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="ml-3 text-gray-600">Chats are not added to your Medisynix records</p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex items-center text-primary-600">
                  <LockClosedIcon className="h-5 w-5 mr-2" />
                  <span className="font-medium">Information only, never a diagnosis</span>
                </div>
              </div>
            </div>
          </div>
          <div className="px-6 py-4 bg-blue-50">
            <button 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg flex items-center justify-center transition"
              disabled={isLoading}
              onClick={(e) => {
                e.stopPropagation();
                handleDoctorSelect('general');
              }}
            >
              {isLoading && selectedDoctor === 'general' ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
              ) : null}
              Select General AI Doctor
              <ArrowRightIcon className="h-5 w-5 ml-2" />
            </button>
          </div>
        </div>

        {/* Personal AI Doctor */}
        <div 
          className={`bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer border-2 ${
            selectedDoctor === 'personal' ? 'border-primary-500' : 'border-transparent'
          }`}
          onClick={() => handleDoctorSelect('personal')}
        >
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <UserCircleIcon className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <h2 className="text-xl font-bold text-gray-800">Personal AI Doctor</h2>
                  <p className="text-primary-600">Personalized Health Assistant</p>
                </div>
              </div>
              {selectedDoctor === 'personal' && (
                <CheckIcon className="h-6 w-6 text-primary-600" />
              )}
            </div>

            <div className="mt-6">
              <p className="text-gray-600 mb-4">
                Chat with an assistant that shows your saved health summary (age, conditions, allergies and
                medications) next to the conversation, so you can mention the right details.
              </p>

              <div className="space-y-3 mt-6">
                <div className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="ml-3 text-gray-600">Personalized health recommendations</p>
                </div>
                <div className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="ml-3 text-gray-600">Your saved health summary shown alongside the chat</p>
                </div>
                <div className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="ml-3 text-gray-600">Reminds you of your conditions, allergies and medications</p>
                </div>
                <div className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="ml-3 text-gray-600">Helps you decide when to book a doctor</p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex items-center text-primary-600">
                  <ShieldCheckIcon className="h-5 w-5 mr-2" />
                  <span className="font-medium">Your health summary is only visible to you</span>
                </div>
              </div>
            </div>
          </div>
          <div className="px-6 py-4 bg-green-50">
            <button 
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg flex items-center justify-center transition"
              disabled={isLoading}
              onClick={(e) => {
                e.stopPropagation();
                handleDoctorSelect('personal');
              }}
            >
              {isLoading && selectedDoctor === 'personal' ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
              ) : null}
              Select Personal AI Doctor
              <ArrowRightIcon className="h-5 w-5 ml-2" />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-12 bg-gray-50 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Important Information</h2>
        <div className="text-gray-600 space-y-2">
          <p>• The AI Doctor provides information for educational purposes only and is not a replacement for professional medical advice.</p>
          <p>• In case of a medical emergency, please call emergency services immediately.</p>
          <p>• We recommend consulting with a human healthcare provider for diagnosis and treatment decisions.</p>
          <p>• The Personal AI Doctor shows the health summary saved in your profile. Keep it up to date for the most useful conversations.</p>
        </div>
      </div>
    </div>
  );
} 