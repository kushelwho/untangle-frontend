const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('untangle_token');
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const message = data?.message || data?.error || `Request failed (${res.status})`;
    throw new Error(message);
  }

  return data;
}

// ─── Auth ────────────────────────────────────────────────
export const auth = {
  signup: (body) => request('/auth/signup', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
};

// ─── Groups ──────────────────────────────────────────────
export const groups = {
  create: (body) => request('/groups', { method: 'POST', body: JSON.stringify(body) }),
  get: (groupId) => request(`/groups/${groupId}`),
  addMember: (groupId, body) => request(`/groups/${groupId}/members`, { method: 'POST', body: JSON.stringify(body) }),
};

// ─── Expenses ────────────────────────────────────────────
export const expenses = {
  create: (groupId, body) => {
    const headers = { 'Idempotency-Key': crypto.randomUUID() };
    return request(`/groups/${groupId}/expenses`, { method: 'POST', body: JSON.stringify(body), headers });
  },
  list: (groupId) => request(`/groups/${groupId}/expenses`),
  delete: (groupId, expenseId) => request(`/groups/${groupId}/expenses/${expenseId}`, { method: 'DELETE' }),
};

// ─── Balances ────────────────────────────────────────────
export const balances = {
  group: (groupId) => request(`/groups/${groupId}/balances`),
  me: () => request('/users/me/balances'),
};

// ─── Settlements ─────────────────────────────────────────
export const settlements = {
  settleUp: (groupId, body, idempotencyKey) => {
    const headers = {};
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }
    return request(`/groups/${groupId}/settle`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers,
    });
  },
  plan: (groupId) => request(`/groups/${groupId}/settlement-plan`),
  history: (groupId) => request(`/groups/${groupId}/settlements`),
};
