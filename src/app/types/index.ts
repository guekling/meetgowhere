export enum UserRoles {
  INITIATOR = 'initiator',
  PARTICIPANT = 'participant',
}

export enum SessionStatus {
  ACTIVE = 'active',
  ENDED = 'ended',
}

export enum ErrorType {
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  MISSING_INVITE_TOKEN = 'MISSING_INVITE_TOKEN',
  INVALID_INVITE_TOKEN = 'INVALID_INVITE_TOKEN',
  UNAUTHORIZED = 'UNAUTHORIZED',
  BAD_REQUEST = 'BAD_REQUEST',
}

export const ErrorDetails: Record<ErrorType, { message: string; status: number }> = {
  [ErrorType.INTERNAL_SERVER_ERROR]: { message: 'Internal server error', status: 500 },
  [ErrorType.MISSING_INVITE_TOKEN]: { message: 'Missing invite token', status: 400 },
  [ErrorType.INVALID_INVITE_TOKEN]: { message: 'Invalid invite token', status: 400 },
  [ErrorType.UNAUTHORIZED]: { message: 'Unauthorized', status: 401 },
  [ErrorType.BAD_REQUEST]: { message: 'Bad request', status: 400 },
};
