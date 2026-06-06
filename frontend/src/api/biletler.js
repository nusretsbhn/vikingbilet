import client from './client';

export async function fetchBiletler(params = {}) {
  const { data } = await client.get('/biletler', { params });
  return data;
}

export async function fetchBilet(id) {
  const { data } = await client.get(`/biletler/${id}`);
  return data.bilet;
}

export async function createBilet(payload) {
  const { data } = await client.post('/biletler', payload);
  return data.bilet;
}

export async function createBiletBulk(biletler) {
  const { data } = await client.post('/biletler/bulk', { biletler });
  return data;
}

export async function updateBilet(id, payload) {
  const { data } = await client.put(`/biletler/${id}`, payload);
  return data.bilet;
}

export async function deleteBilet(id) {
  const { data } = await client.delete(`/biletler/${id}`);
  return data;
}

export async function exportBiletler(params = {}) {
  const response = await client.get('/biletler/export', {
    params,
    responseType: 'blob',
  });
  return response.data;
}

export async function importBiletler(file) {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await client.post('/biletler/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}
