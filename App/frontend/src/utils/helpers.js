export function formatAge(birthDate) {
  if (!birthDate) return '';
  const diff = Date.now() - new Date(birthDate).getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}

export function formatDistance(km) {
  if (km == null) return '';
  if (km < 1) return 'Menos de 1 km';
  return `${Math.round(km)} km`;
}

export function formatTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'Ahora';
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHr < 24) return `${diffHr}h`;
  if (diffDay < 7) return `${diffDay}d`;
  return date.toLocaleDateString();
}

export function getPhotoUrl(user) {
  if (!user?.photos?.length) return null;
  const sorted = [...user.photos].sort((a, b) => a.order - b.order);
  return sorted[0].url;
}

export function extractApiError(error) {
  if (error.response?.data?.error) return error.response.data.error;
  if (error.response?.data?.details) return error.response.data.details;
  if (error.message) return error.message;
  return 'Error desconocido';
}
