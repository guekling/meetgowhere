import { v4 as uuidv4 } from 'uuid';

import db from '../db/models';
import { LatLng, LocationInfo, LocationSource, ParticipantInfo, SessionInfo, SessionStatus } from '@/app/types';
import { Session } from '../db/models/session';
import { computeCentroid } from '../utils/geo';

export async function createSession(sessionId: string, userId: string): Promise<Session> {
  const inviteToken = uuidv4();
  const newSession = await db.Session.create({
    id: sessionId,
    status: SessionStatus.ACTIVE,
    invite_token: inviteToken,
    created_by: userId,
    created_at: new Date(),
  });

  return newSession;
}

export async function getSessionById(sessionId: string): Promise<Session | null> {
  const session = await db.Session.findByPk(sessionId);
  return session;
}

export async function isSessionInvalid(sessionId: string, token: string): Promise<boolean> {
  const session = await getSessionById(sessionId);
  if (!session) return true;

  const isInvalid =
    session.getDataValue('status') !== SessionStatus.ACTIVE ||
    session.getDataValue('invite_token') !== token;

  return isInvalid;
}

export async function isSessionActive(sessionId: string): Promise<boolean> {
  const session = await getSessionById(sessionId);
  if (!session) return false;

  return session.getDataValue('status') === SessionStatus.ACTIVE;
}

export async function hasComputedLocation(sessionId: string): Promise<boolean> {
  const session = await getSessionById(sessionId);
  if (!session) return false;

  return session.getDataValue('computed_location') !== null;
}

export async function getSessionUserLocations(sessionId: string): Promise<LatLng[]> {
  const usersInSession = await db.User.findAll({
    where: { session_id: sessionId },
  });

  const locations = usersInSession
    .map((user) => {
      const location = user.getDataValue('location');
      if (!location) {
        return;
      }
      return { lat: location.lat, lng: location.lng };
    })
    .filter((location) => location !== undefined);

  return locations;
}

export async function computeLocation(sessionId: string, locations: LatLng[]): Promise<LocationInfo> {
  const centroid = computeCentroid(locations);
  const computedLocation = {
    lat: centroid.lat,
    lng: centroid.lng,
    source: LocationSource.AUTOMATIC,
    updated_at: new Date().toISOString(),
  };

  await db.Session.update(
    {
      computed_location: computedLocation,
    },
    {
      where: { id: sessionId },
    }
  );

  return computedLocation;
}

export async function getSessionInformation(sessionId: string): Promise<SessionInfo | null> {
  const session = await getSessionById(sessionId);
  if (!session) return null;

  const usersInSession = await db.User.findAll({
    where: { session_id: sessionId },
  });
  const usersInfo = usersInSession.map<ParticipantInfo>((user) => {
    const location = user.getDataValue('location');
    return {
      username: user.getDataValue('username'),
      role: user.getDataValue('role'),
      location: location
        ? {
          lat: location.lat,
          lng: location.lng,
        }
        : null,
    };
  });

  return {
    id: session.getDataValue('id'),
    status: session.getDataValue('status'),
    createdBy: session.getDataValue('created_by'),
    createdAt: session.getDataValue('created_at'),
    updatedAt: session.getDataValue('updated_at'),
    endedAt: session.getDataValue('ended_at'),
    inviteToken: session.getDataValue('invite_token'),
    computedLocation: session.getDataValue('computed_location'),
    overrideLocation: session.getDataValue('override_location'),
    participants: usersInfo,
  };
}