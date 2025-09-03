'use client';

import SessionInvalidPage from '@/app/components/SessionInvalidPage';
import { getGeoLocation } from '@/app/utils';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function JoinSession() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();

  const { id: sessionId } = params;
  const token = searchParams.get('token');

  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSessionInfoPage, setShowSessionInfoPage] = useState(false);

  const [isSessionValid, setIsSessionValid] = useState(false);
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(false);

  const handleJoinSession = async () => {
    if (!username.trim()) {
      setError('Please enter your username');
      return;
    }

    // join session api
    setLoading(true);
    try {
      const location = await getGeoLocation();

      const res = await fetch(`/api/sessions/${sessionId}/join?token=${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, location }),
      });

      if (!res.ok) {
        setError('Failed to join session');
      } else {
        setShowSessionInfoPage(true);
      }
    } catch (err) {
      setError('Failed to join session');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkUserAuth = async () => {
      try {
        const res = await fetch('/api/auth', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (res.ok) {
          setIsUserAuthenticated(true);
        }
      } catch (err) {
        setIsUserAuthenticated(false);
      }
    };

    const validateSession = async () => {
      if (!sessionId || !token) {
        setIsSessionValid(false);
      }

      try {
        const res = await fetch(`/api/sessions/${sessionId}/validate?token=${token}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (res.ok) {
          setIsSessionValid(true);
        }
      } catch (error) {
        setIsSessionValid(false);
      }
    };

    checkUserAuth();
    // ensures the sessionId matches the inviteToken
    validateSession();
  }, [sessionId, token]);

  // if user is already authenticated, redirect to session info page
  useEffect(() => {
    if (isUserAuthenticated) {
      router.push(`/s/${sessionId}`);
    }
  }, [isUserAuthenticated, sessionId, router]);

  // if user has successfully joined, redirect to session info page
  useEffect(() => {
    if (showSessionInfoPage) {
      router.push(`/s/${sessionId}`);
    }
  }, [showSessionInfoPage, sessionId, router]);

  if (!isSessionValid) {
    return <SessionInvalidPage />;
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm flex flex-col items-center">
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 mb-4"
          placeholder="Enter your username"
        />
        <button
          onClick={handleJoinSession}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition mb-2"
        >
          {loading ? 'Joining...' : 'Join'}
        </button>
        {error && <div className="w-full text-center text-red-600 mt-2">{error}</div>}
      </div>
    </main>
  );
}
