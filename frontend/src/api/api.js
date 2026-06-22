import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5005/api';

export const api = axios.create({ baseURL: API_URL });

export function withAuth() {
  const token = localStorage.getItem('nudge_token') || '';
  return { headers: { Authorization: `Bearer ${token}` } };
}

export function saveAuth(token, business) {
  localStorage.setItem('nudge_token', token);
  localStorage.setItem('nudge_business', JSON.stringify(business));
}

export function getStoredBusiness() {
  const b = localStorage.getItem('nudge_business');
  return b ? JSON.parse(b) : null;
}

export function clearAuth() {
  localStorage.removeItem('nudge_token');
  localStorage.removeItem('nudge_business');
}

export function isLoggedIn() {
  return Boolean(localStorage.getItem('nudge_token'));
}