import client from './client';

export async function fetchFaviconConfig() {
  const { data } = await client.get('/settings/favicon/config');
  return data;
}

export async function uploadFavicon(file) {
  const formData = new FormData();
  formData.append('favicon', file);
  const { data } = await client.post('/settings/favicon', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function deleteFavicon() {
  const { data } = await client.delete('/settings/favicon');
  return data;
}

export function faviconFileUrl(updatedAt) {
  const ts = updatedAt ? new Date(updatedAt).getTime() : Date.now();
  return `/api/settings/favicon?t=${ts}`;
}

export async function purgeAllData(password) {
  const { data } = await client.post('/settings/purge-data', { password });
  return data;
}
