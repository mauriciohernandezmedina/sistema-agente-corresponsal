import axios from 'axios';

const musoniApi = axios.create({
  baseURL: process.env.MUSONI_BASE_URL,
});

musoniApi.interceptors.request.use((config) => {
  const username = process.env.MUSONI_USER;
  const password = process.env.MUSONI_PASSWORD;
  const tenantId = process.env.MUSONI_TENANT_ID;

  if (username && password) {
    const auth = Buffer.from(`${username}:${password}`).toString('base64');
    config.headers.Authorization = `Basic ${auth}`;
  }

  if (tenantId) {
    config.headers['X-Tenant-Identifier'] = tenantId;
  }

  config.headers['Content-Type'] = 'application/json';

  return config;
}, (error) => {
  return Promise.reject(error);
});

export default musoniApi;
