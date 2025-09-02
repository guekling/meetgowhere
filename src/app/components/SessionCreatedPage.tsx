'use client';

import { useState } from 'react';

interface Props {
  name: string;
  inviteUrl: string;
}

export default function SessionCreatedPage({ name, inviteUrl }: Props) {
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 1500);
    } catch {
      setCopiedLink(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="max-w-md w-full flex flex-col items-center">
        <h1 className="text-2xl font-bold mb-4">Hello, {name}</h1>
        <p className="mb-6 text-gray-700 text-center">Share this invite link with your friends</p>
        <button
          onClick={handleCopy}
          className="w-full flex items-center justify-between px-4 py-3 bg-blue-100 rounded-lg border border-blue-300 hover:bg-blue-200 transition mb-2"
        >
          <span className="truncate text-blue-700 text-left">{inviteUrl}</span>
          {/* Heroicons Link SVG */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="ml-2 h-6 w-6 text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.828 10.172a4 4 0 010 5.656l-3.536 3.536a4 4 0 01-5.656-5.656l1.414-1.414m6.364-6.364a4 4 0 015.656 5.656l-1.414 1.414"
            />
          </svg>
        </button>
        {copiedLink && <span className="text-green-600 mt-2">Copied!</span>}
      </div>
    </main>
  );
}
