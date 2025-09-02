import { v4 as uuidv4 } from 'uuid';

import db from '../db/models';
import { LatLng, LocationInfo, LocationSource, SessionStatus } from '@/app/types';
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