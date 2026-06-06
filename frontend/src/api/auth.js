import client from './client';

export async function login(username, password) {
  const { data } = await client.post('/auth/login', { username, password });
  return data;
}

export async function logout() {
  const { data } = await client.post('/auth/logout');
  return data;
}

export async function getMe() {
  const { data } = await client.get('/auth/me');
  return data;
}
