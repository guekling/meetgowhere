import { LocationSource } from './types';

export async function getGeoLocation() {
  const geo = await new Promise<GeolocationPosition>((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject)
  );

  const location = {
    lat: geo.coords.latitude,
    lng: geo.coords.longitude,
    source: LocationSource.AUTOMATIC,
    updated_at: new Date().toISOString(),
  };

  return location;
}
