export interface CreateSessionResponse {
  session: {
    id: string;
    invite_token: string;
  };
}
