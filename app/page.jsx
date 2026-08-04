import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-white px-4">
      <div className="text-center max-w-2xl">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Welcome to <span className="text-blue-600">Medisynix</span>
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          AI-powered healthcare platform for patients and doctors.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/login"
            className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="px-8 py-3 border-2 border-blue-600 text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
          >
            Register
          </Link>
        </div>
      </div>
    </div>
  );
}