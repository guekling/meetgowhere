import { LatLng } from '../../types';

export function computeCentroid(points: LatLng[]): LatLng {
  const lat = points.reduce((sum, point) => sum + point.lat, 0) / points.length;
  const lng = points.reduce((sum, point) => sum + point.lng, 0) / points.length;
  return { lat, lng };
}
