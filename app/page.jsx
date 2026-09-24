<<<<<<< HEAD
import HeroSection from "../components/landing/HeroSection";
import TrustBar from "../components/landing/TrustBar";
import FeaturesSection from "../components/landing/FeaturesSection";
import HowItWorks from "../components/landing/HowItWorks";
import ChatbotDemo from "../components/landing/ChatbotDemo";
import TestimonialsSection from "../components/landing/TestimonialsSection";
import Disclaimer from "../components/landing/Disclaimer";
=======
// import Link from 'next/link';

// export default function HomePage() {
//   return (
//     <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-white px-4">
//       <div className="text-center max-w-2xl">
//         <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
//           Welcome to <span className="text-blue-600">Medisynix</span>
//         </h1>
//         <p className="text-lg text-gray-600 mb-8">
//           AI-powered healthcare platform for patients and doctors.
//         </p>
//         <div className="flex flex-col sm:flex-row gap-4 justify-center">
//           <Link
//             href="/login"
//             className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
//           >
//             Login
//           </Link>
//           <Link
//             href="/register"
//             className="px-8 py-3 border-2 border-blue-600 text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
//           >
//             Register
//           </Link>
//         </div>
//       </div>
//     </div>
//   );
// }

"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
>>>>>>> d4dec0f067516f397bc023ade1c3a6e98d1ba8f9

export default function HomePage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userType, setUserType] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        setIsLoggedIn(true);
        setUserType(user.type);
      } catch {
        setIsLoggedIn(false);
      }
    }
  }, []);

  const handleDashboardClick = () => {
    if (userType) {
      router.push(`/dashboard/${userType}`);
    }
  };

  return (
<<<<<<< HEAD
    <div>
      <HeroSection />
      <TrustBar />
      <FeaturesSection />
      <HowItWorks />
      <ChatbotDemo />
      <TestimonialsSection />
      <Disclaimer />
=======
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-white px-4">
      <div className="text-center max-w-2xl">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Welcome to <span className="text-blue-600">Medisynix</span>
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          AI-powered healthcare platform for patients and doctors.
        </p>

        {isLoggedIn ? (
          <div className="flex flex-col items-center gap-4">
            <p className="text-green-600 font-medium">You are logged in!</p>
            <button
              onClick={handleDashboardClick}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard
            </button>
            <Link
              href="/login"
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
              }}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Logout
            </Link>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login" className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
              Login
            </Link>
            <Link href="/register" className="px-8 py-3 border-2 border-blue-600 text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors">
              Register
            </Link>
          </div>
        )}
      </div>

      {/* Sections for hash links */}
      <section id="features" className="mt-20 py-12 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Features</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="font-semibold text-lg mb-2">AI Doctor</h3>
            <p className="text-gray-600 text-sm">Get instant medical guidance from our AI-powered doctor.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="font-semibold text-lg mb-2">Find a Doctor</h3>
            <p className="text-gray-600 text-sm">Connect with qualified healthcare professionals.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="font-semibold text-lg mb-2">Health Records</h3>
            <p className="text-gray-600 text-sm">Manage your medical history securely.</p>
          </div>
        </div>
      </section>

      <section id="testimonials" className="mt-12 py-12 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Testimonials</h2>
        <p className="text-gray-600 text-center">Trusted by thousands of patients and doctors.</p>
      </section>

      <section id="contact" className="mt-12 py-12 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Contact</h2>
        <p className="text-gray-600 text-center">Email: support@medisynix.com</p>
      </section>

      <section id="documents" className="mt-12 py-12 max-w-4xl mx-auto mb-20">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Documents</h2>
        <p className="text-gray-600 text-center">Access medical guides and health resources.</p>
      </section>
>>>>>>> d4dec0f067516f397bc023ade1c3a6e98d1ba8f9
    </div>
  );
}