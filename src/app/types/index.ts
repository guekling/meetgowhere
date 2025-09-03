export enum UserRoles {
  INITIATOR = 'initiator',
  PARTICIPANT = 'participant',
}

export enum SessionStatus {
  ACTIVE = 'active',
  ENDED = 'ended',
}

export enum LocationSource {
  AUTOMATIC = 'automatic',
  MANUAL = 'manual',
}

export interface LocationInfo {
  lat: number;
  lng: number;
  source: LocationSource;
  updated_at: string;
}

export interface LatLng {
  lat: number;
  lng: number;
}

export interface ParticipantInfo {
  username: string;
  role: UserRoles;
  location: LatLng;
}

export interface SessionInfo {
  id: string;
  status: SessionStatus;
  created_by: string;
  created_at: Date;
  updated_at: Date;
  ended_at: Date | null;
  invite_token: string;
  computed_location: LocationInfo | null;
  override_location: LocationInfo | null;
  participants: ParticipantInfo[];
}

export enum ErrorType {
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  MISSING_INVITE_TOKEN = 'MISSING_INVITE_TOKEN',
  INVALID_INVITE_TOKEN = 'INVALID_INVITE_TOKEN',
  UNAUTHORIZED = 'UNAUTHORIZED',
  BAD_REQUEST = 'BAD_REQUEST',
  INVALID_SESSION = 'INVALID_SESSION',
}

export const ErrorDetails: Record<ErrorType, { message: string; status: number }> = {
  [ErrorType.INTERNAL_SERVER_ERROR]: { message: 'Internal server error', status: 500 },
  [ErrorType.MISSING_INVITE_TOKEN]: { message: 'Missing invite token', status: 400 },
  [ErrorType.INVALID_INVITE_TOKEN]: { message: 'Invalid invite token', status: 400 },
  [ErrorType.UNAUTHORIZED]: { message: 'Unauthorized', status: 401 },
  [ErrorType.BAD_REQUEST]: { message: 'Bad request', status: 400 },
  [ErrorType.INVALID_SESSION]: { message: 'Invalid session', status: 400 },
};
