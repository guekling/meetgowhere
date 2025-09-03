'use client';

import LoadingPage from '@/app/components/LoadingPage';
import SessionCancelledPage from '@/app/components/SessionCancelledPage';
import SessionEndedPage from '@/app/components/SessionEndedPage';
import SessionInvalidPage from '@/app/components/SessionInvalidPage';
import SessionParticipantsTable from '@/app/components/SessionParticipantsTable';
import UpdateLocationModal from '@/app/components/UpdateLocationModal';
import { LocationInfo, SessionStatus, UserRoles } from '@/app/types';
import {
  AuthResponse,
  ComputeLocationResponse,
  EndSessionResponse,
  GetSessionResponse,
} from '@/app/types/responses';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export default function Session() {
  const params = useParams();
  const sessionId =
    typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';

  const [pageLoading, setPageLoading] = useState(false);
  const [pageError, setPageError] = useState('');

  const [computeLocError, setComputeLocError] = useState('');
  const [computeLocLoading, setComputeLocLoading] = useState(false);

  const [endSessionError, setEndSessionError] = useState('');

  const [isUserAuthenticated, setIsUserAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState('');

  const [sessionStatus, setSessionStatus] = useState(SessionStatus.ACTIVE);
  const [participants, setParticipants] = useState([]);
  const [computedLocation, setComputedLocation] = useState<LocationInfo | null>(null);
  const [overrideLocation, setOverrideLocation] = useState<LocationInfo | null>(null);
  const [inviteUrl, setInviteUrl] = useState('');

  const [copiedLink, setCopiedLink] = useState(false);

  const [showLocationModal, setShowLocationModal] = useState(false);
  const [shouldDisableComputeBtn, setShouldDisableComputeBtn] = useState(true);

  const onComputeLocation = async () => {
    setComputeLocLoading(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/compute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        const data: ComputeLocationResponse = await res.json();
        setComputedLocation(data.computed_location);
      } else {
        setComputeLocError('Failed to compute location');
      }
    } catch (error) {
      setComputeLocError('Failed to compute location');
    } finally {
      setComputeLocLoading(false);
    }
  };

  const getSessionInfo = useCallback(async () => {
    setPageLoading(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        const data: GetSessionResponse = await res.json();

        const availLocations = data.session.participants
          .map((participant) => participant.location)
          .filter((location) => location !== null);

        setParticipants(data.session.participants);
        setComputedLocation(data.session.computed_location);
        setOverrideLocation(data.session.override_location);
        setSessionStatus(data.session.status);
        setInviteUrl(
          `${window.location.origin}/s/${data.session.id}/join?token=${data.session.invite_token}`
        );
        setShouldDisableComputeBtn(
          availLocations.length < 2 || data.session.computed_location !== null
        );
      } else {
        setPageError('Failed to load session info');
      }
    } catch (err) {
      setPageError('Failed to load session info');
    } finally {
      setPageLoading(false);
    }
  }, [sessionId]);

  const onEndSession = async () => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}/end`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        const data: EndSessionResponse = await res.json();
        setSessionStatus(data.session.status);
      } else {
        setEndSessionError('Failed to end session');
      }
    } catch (error) {
      setEndSessionError('Failed to end session');
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 1500);
    } catch {
      setCopiedLink(false);
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
        const data: AuthResponse = await res.json();

        if (res.ok && data.user.sessionId === sessionId) {
          setIsUserAuthenticated(true);
          setUserRole(data.user.role);
        }
      } catch (err) {
        setIsUserAuthenticated(false);
      } finally {
        setPageLoading(false);
      }
    };

    checkUserAuth();
  }, [sessionId]);

  useEffect(() => {
    if (isUserAuthenticated) {
      getSessionInfo();
    }
  }, [isUserAuthenticated, sessionId, getSessionInfo]);

  if (pageLoading) {
    return <LoadingPage />;
  }

  if (pageError) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="text-red-600">{pageError}</div>
      </main>
    );
  }

  if (!isUserAuthenticated) {
    return <SessionInvalidPage />;
  }

  if (sessionStatus !== SessionStatus.ACTIVE) {
    const location = overrideLocation ? overrideLocation : computedLocation;

    if (!location) {
      return <SessionCancelledPage />;
    }

    return <SessionEndedPage location={location} />;
  }

  if (userRole === UserRoles.PARTICIPANT) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        {/* Table */}
        <div className="w-full mb-6">
          <SessionParticipantsTable participants={participants} />
        </div>
        {/* End Table */}

        {/* Footer */}
        <div className="w-full flex justify-center">
          {computedLocation || overrideLocation ? (
            <div className="flex gap-4">
              <button className="py-2 px-4 bg-green-600 text-white rounded">
                Meeting Location:{' '}
                {overrideLocation
                  ? `(${overrideLocation.lat}, ${overrideLocation.lng})`
                  : `(${computedLocation.lat}, ${computedLocation.lng})`}
              </button>
            </div>
          ) : (
            <button className="py-2 px-6 bg-yellow-600 text-white rounded">
              No Meeting Location Yet
            </button>
          )}
        </div>
        {/* End Footer */}
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      {/* Header */}
      <div>
        <div className="w-full mb-6 columns-2 gap-4 flex justify-between">
          <button
            onClick={onEndSession}
            className="py-2 px-4 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            End Session
          </button>
          {endSessionError && <div className="text-red-600">{endSessionError}</div>}

          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition flex items-center"
            >
              Copy Invite Link
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="ml-2 h-5 w-5 text-white"
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
        </div>
      </div>
      {/* End Header */}

      {/* Table */}
      <div className="w-full mb-6">
        <SessionParticipantsTable participants={participants} />
      </div>
      {/* End Table */}

      {/* Footer */}
      <div className="w-full flex justify-center">
        {computedLocation || overrideLocation ? (
          <div className="flex gap-4">
            <button className="py-2 px-4 bg-green-600 text-white rounded">
              Meeting Location:
              {overrideLocation
                ? `(${overrideLocation.lat}, ${overrideLocation.lng})`
                : `(${computedLocation.lat}, ${computedLocation.lng})`}
            </button>

            {!overrideLocation && (
              <button
                onClick={() => setShowLocationModal(true)}
                className="py-2 px-4 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition"
              >
                Update Location
              </button>
            )}
          </div>
        ) : (
          <>
            <button
              onClick={onComputeLocation}
              className={`py-2 px-6 rounded transition
                ${
                  shouldDisableComputeBtn
                    ? 'bg-gray-400 text-gray-200 opacity-50 cursor-not-allowed'
                    : 'bg-yellow-600 text-white hover:bg-yellow-700'
                }
                `}
              disabled={shouldDisableComputeBtn}
            >
              {computeLocLoading ? 'Computing...' : 'Compute Meeting Location'}
            </button>
            <div>{computeLocError && <span className="text-red-600">{computeLocError}</span>}</div>
          </>
        )}
      </div>
      {/* End Footer */}

      <UpdateLocationModal
        open={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        sessionId={sessionId}
        onSuccess={getSessionInfo}
      />
    </main>
  );
}
