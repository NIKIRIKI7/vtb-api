import axios, { type AxiosInstance } from 'axios';

const BASE_URL: string = "http://localhost:8000";

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
  withCredentials: true,
});


export default api;
