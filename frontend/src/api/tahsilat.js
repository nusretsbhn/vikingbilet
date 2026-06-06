import client from './client';

export async function fetchTahsilat(params = {}) {
  const { data } = await client.get('/tahsilat', { params });
  return data;
}

export async function fetchAcentaList() {
  const { data } = await client.get('/tahsilat/acenta-list');
  return data;
}

export async function createTahsilat(payload) {
  const { data } = await client.post('/tahsilat', payload);
  return data.tahsilat;
}

export async function deleteTahsilat(id) {
  const { data } = await client.delete(`/tahsilat/${id}`);
  return data;
}
