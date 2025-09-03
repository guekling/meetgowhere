import { LocationInfo, SessionInfo, UserRoles } from '.';
import { SessionAttributes } from '../server/db/models/session';

export interface CreateSessionResponse {
  session: {
    id: string;
    invite_token: string;
  };
}

export interface GetSessionResponse {
  session: SessionInfo;
}

export interface ComputeLocationResponse {
  computed_location: LocationInfo;
}

export interface UpdateLocationResponse {
  session: SessionAttributes;
}

export interface EndSessionResponse {
  session: SessionAttributes;
}

export interface AuthResponse {
  user: {
    username: string;
    role: UserRoles;
    sessionId: string;
  };
}
