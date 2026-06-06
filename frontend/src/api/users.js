import client from './client';

export async function fetchUsers() {
  const { data } = await client.get('/users');
  return data;
}

export async function createUser(payload) {
  const { data } = await client.post('/users', payload);
  return data.user;
}

export async function updateUser(id, payload) {
  const { data } = await client.put(`/users/${id}`, payload);
  return data.user;
}

export async function deleteUser(id) {
  const { data } = await client.delete(`/users/${id}`);
  return data;
}
