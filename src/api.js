export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const TOKEN_KEY = 'musterpay_token';
export const getToken = () => localStorage.getItem(TOKEN_KEY);
const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

let unauthorizedHandler = null;
export const setUnauthorizedHandler = (fn) => { unauthorizedHandler = fn; };

async function req(path, options = {}) {
  const token = getToken();
  const res = await fetch(API_BASE + path, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  if (res.status === 401) {
    clearToken();
    if (unauthorizedHandler) unauthorizedHandler();
  }
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try { const j = await res.json(); if (j.error) msg = j.error; } catch (_) {}
    throw new Error(msg);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  login: async (email, password) => {
    const data = await req('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    setToken(data.token);
    return data.user;
  },
  me: () => req('/auth/me'),
  logout: () => clearToken(),

  // employee self-service
  getMyPayslips: () => req('/me/payslips'),
  getMyAttendance: (year, month) => req(`/me/attendance?year=${year}&month=${month}`),

  // admin (HR)
  listEmployees: () => req('/employees'),
  createEmployee: (body) => req('/employees', { method: 'POST', body: JSON.stringify(body) }),
  updateEmployee: (id, body) => req(`/employees/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteEmployee: (id) => req(`/employees/${id}`, { method: 'DELETE' }),
  createEmployeeLogin: (id, body) => req(`/employees/${id}/login`, { method: 'POST', body: JSON.stringify(body) }),
  listAttendance: (year, month) => req(`/attendance?year=${year}&month=${month}`),
  markAttendance: (body) => req('/attendance', { method: 'PUT', body: JSON.stringify(body) }),
  runPayroll: (year, month) => req(`/payroll/run?year=${year}&month=${month}`),
  finalize: (year, month) => req(`/payroll/finalize?year=${year}&month=${month}`, { method: 'POST' }),
  getPolicy: () => req('/policy'),
  updatePolicy: (body) => req('/policy', { method: 'PATCH', body: JSON.stringify(body) }),

  // hiring
  listCandidates: () => req('/candidates'),
  createCandidate: (body) => req('/candidates', { method: 'POST', body: JSON.stringify(body) }),
  updateCandidate: (id, body) => req(`/candidates/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteCandidate: (id) => req(`/candidates/${id}`, { method: 'DELETE' }),
  acceptCandidate: (id, body) => req(`/candidates/${id}/accept`, { method: 'POST', body: JSON.stringify(body) }),
  rejectCandidate: (id, body) => req(`/candidates/${id}/reject`, { method: 'POST', body: JSON.stringify(body) }),
};