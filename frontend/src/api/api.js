import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5005/api';

export const api = axios.create({ baseURL: API_URL });

export function withAdminAuth() {
  const passcode = localStorage.getItem('nudge_admin_passcode') || '';
  return { headers: { 'x-admin-passcode': passcode } };
}