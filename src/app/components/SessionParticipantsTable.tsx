'use client';

import { ParticipantInfo, UserRoles } from '../types';

interface Props {
  participants: ParticipantInfo[];
}

export default function SessionParticipantsTable({ participants }: Props) {
  return (
    <div>
      <table className="w-full text-center">
        <thead>
          <tr>
            <th className="w-3xs">Username</th>
            <th className="w-3xs">Location</th>
          </tr>
        </thead>
        <tbody>
          {participants.map((p, idx) => (
            <tr key={idx}>
              {p.role === UserRoles.INITIATOR ? (
                <td>{p.username} (INITIATOR)</td>
              ) : (
                <td>{p.username}</td>
              )}

              <td>
                {p.location ? `(${p.location.lat}, ${p.location.lng})` : 'No Location Recorded'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
