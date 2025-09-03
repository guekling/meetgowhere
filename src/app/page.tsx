'use client';

import { useEffect, useState } from 'react';
import SessionCreatedPage from './components/SessionCreatedPage';
import { getGeoLocation } from './utils';
import { useRouter } from 'next/navigation';
import LoadingPage from './components/LoadingPage';
import { CreateSessionResponse } from './types/responses';

export default function Home() {
  const router = useRouter();

  const [pageLoading, setPageLoading] = useState(false);

  const [username, setUsername] = useState('');
  const [createSessionLoading, setCreateSessionLoading] = useState(false);
  const [error, setError] = useState('');

  const [inviteUrl, setInviteUrl] = useState('');
  const [showInvite, setShowInvite] = useState(false);

  const [isUserAuthenticated, setIsUserAuthenticated] = useState(false);
  const [sessionId, setSessionId] = useState('');

  const handleCreateSession = async () => {
    if (!username.trim()) {
      setError('Please enter your username');
      return;
    }

    // create session api
    setCreateSessionLoading(true);
    try {
      const location = await getGeoLocation();

      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, location }),
      });
      const data: CreateSessionResponse = await res.json();

      if (res.ok) {
        setInviteUrl(
          `${window.location.origin}/s/${data.session.id}/join?token=${data.session.invite_token}`
        );
        setSessionId(data.session.id);
        setShowInvite(true);
      } else {
        setError('Failed to create session');
      }
    } catch (err) {
      setError('Failed to create session');
    } finally {
      setCreateSessionLoading(false);
    }
  };

  useEffect(() => {
    setPageLoading(true);
    const checkUserAuth = async () => {
      try {
        const res = await fetch('/api/auth', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        const data = await res.json();

        if (res.ok) {
          setIsUserAuthenticated(true);
          setSessionId(data.user.sessionId);
        }
      } catch (err) {
        setIsUserAuthenticated(false);
      } finally {
        setPageLoading(false);
      }
    };

    checkUserAuth();
  }, []);

  // if user is already authenticated, redirect to session info page
  useEffect(() => {
    if (isUserAuthenticated && sessionId) {
      setPageLoading(true);
      router.push(`/s/${sessionId}`);
    }
  }, [isUserAuthenticated, sessionId, router]);

  // if user has successfully created a session, show invite link
  if (showInvite) {
    return <SessionCreatedPage name={username} inviteUrl={inviteUrl} sessionId={sessionId} />;
  }

  if (pageLoading) {
    return <LoadingPage />;
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
          onClick={handleCreateSession}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition mb-2"
        >
          {createSessionLoading ? 'Creating...' : 'Create'}
        </button>
        {error && <div className="w-full text-center text-red-600 mt-2">{error}</div>}
      </div>
    </main>
  );
}
