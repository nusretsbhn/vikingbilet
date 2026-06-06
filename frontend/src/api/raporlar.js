import client from './client';

export async function fetchOzet() {
  const { data } = await client.get('/raporlar/ozet');
  return data;
}

export async function fetchAcentalar(params = {}) {
  const { data } = await client.get('/raporlar/acentalar', { params });
  return data;
}

export async function fetchGunlukRapor(params = {}) {
  const { data } = await client.get('/raporlar/gunluk', { params });
  return data;
}

export async function fetchAylikRapor(params = {}) {
  const { data } = await client.get('/raporlar/aylik', { params });
  return data;
}

export async function fetchYillikRapor() {
  const { data } = await client.get('/raporlar/yillik');
  return data;
}

export async function downloadAcentaDokum(params) {
  const response = await client.get('/raporlar/acenta-dokum', {
    params,
    responseType: 'blob',
  });
  return response.data;
}
