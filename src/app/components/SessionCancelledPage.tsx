'use client';

export default function SessionCancelledPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="max-w-md w-full flex flex-col items-center">
        {/* Icon */}
        <div className="mb-6">
          {/* Heroicons X Circle */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 9l-6 6m0-6l6 6" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-4">Session has been cancelled</h1>
      </div>
    </main>
  );
}
