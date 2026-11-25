const ENDPOINT = 'https://nominatim.openstreetmap.org/reverse';
const USER_AGENT = process.env.GEOCODER_USER_AGENT || 'AI-Lab-Attendance/1.0';
const TIMEOUT_MS = 4000;

function coarseLabel(address = {}) {
  const street = address.road || address.neighbourhood || address.suburb || address.village || address.hamlet;
  const area = address.suburb || address.village || address.city_district;
  const city = address.city || address.town || address.municipality || address.county || address.state_district || address.state;
  const label = [...new Set([street, area, city].filter(Boolean))].join(', ');
  return label ? label.slice(0, 255) : null;
}

export async function reverseGeocode(lat, lng) {
  const url = `${ENDPOINT}?format=jsonv2&zoom=16&addressdetails=1&accept-language=id&lat=${lat}&lon=${lng}`;
  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`geocoder responded ${response.status}`);
  const data = await response.json();
  return coarseLabel(data.address);
}