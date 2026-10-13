// Calcoli sulle coordinate geografiche.

// Distanza in km tra due punti (formula di haversine).
export function distanzaKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // raggio medio della Terra in km
  const rad = (gradi) => (gradi * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// "3,4 km" oppure "meno di 1 km"
export function formattaKm(km) {
  return km < 1 ? 'meno di 1 km' : `${km.toFixed(1).replace('.', ',')} km`;
}
