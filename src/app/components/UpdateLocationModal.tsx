import { useState } from 'react';

interface UpdateLocationModalProps {
  open: boolean;
  sessionId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UpdateLocationModal({
  open,
  sessionId,
  onClose,
  onSuccess,
}: UpdateLocationModalProps) {
  const [lat, setLat] = useState<number | ''>('');
  const [lng, setLng] = useState<number | ''>('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (lat === '' || lng === '') {
      setError('Please enter valid coordinates');
      return;
    }

    // update location api
    try {
      const res = await fetch(`/api/sessions/${sessionId}/location`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ lat, lng }),
      });
      const data = await res.json();

      if (res.ok) {
        setLat(data.session.override_location.lat);
        setLng(data.session.override_location.lng);
        setError(null);
        onClose();
        onSuccess();
      } else {
        setError('Failed to update location');
      }
    } catch (error) {
      setError('Failed to update location');
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-stone-50 z-50">
      <div className="bg-white p-6 rounded shadow-lg w-80">
        <h2 className="text-lg font-bold mb-4 text-center">Update Location</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-2">
            <label className="block text-sm mb-1">Latitude</label>
            <input
              type="number"
              name="lat"
              value={lat}
              onChange={(e) => setLat(Number(e.target.value))}
              required
              className="w-full border px-2 py-1 rounded"
            />
          </div>
          <div className="mb-2">
            <label className="block text-sm mb-1">Longitude</label>
            <input
              type="number"
              name="lng"
              value={lng}
              onChange={(e) => setLng(Number(e.target.value))}
              required
              className="w-full border px-2 py-1 rounded"
            />
          </div>
          {error && <div className="text-red-600 mb-2">{error}</div>}
          <div className="flex gap-2 mt-4 justify-center">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Update
            </button>
            <button
              type="button"
              className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
