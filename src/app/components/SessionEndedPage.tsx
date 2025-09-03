'use client';

import { LocationInfo } from "../types";

interface SessionEndedPageProps {
    location: LocationInfo;
}

export default function SessionEndedPage({ location }: SessionEndedPageProps) {
    return (
        <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
            <div className="max-w-md w-full flex flex-col items-center">
                {/* Icon */}
                <div className="mb-6">
                    {/* Heroicons Check Circle */}
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-16 w-16 text-green-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 12l2 2 4-4"
                        />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold mb-4">Session has ended</h1>
                <button className="py-2 px-4 bg-green-600 text-white rounded">
                    Meeting Location: ({location.lat}, {location.lng})
                </button>
            </div>
        </main>
    );
}
