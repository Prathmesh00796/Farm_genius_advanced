// Central API client — all calls go through here
const BASE_URL = 'http://localhost:8000';

function getToken() {
  return localStorage.getItem('farmgenius_token');
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const err = await res.json();
      detail = err.detail || detail;
    } catch { /* ignore */ }
    throw new Error(detail);
  }

  // Some DELETE endpoints return empty body
  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authAPI = {
  register: (body) =>
    request('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),

  login: (email, password) =>
    request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  me: () => request('/api/auth/me'),
};

// ─── Profiles ─────────────────────────────────────────────────────────────────

export const profilesAPI = {
  get: (userId) => request(`/api/profiles/${userId}`),
  update: (userId, data) =>
    request(`/api/profiles/${userId}`, { method: 'PUT', body: JSON.stringify(data) }),
};

// ─── Market Prices ────────────────────────────────────────────────────────────

export const marketAPI = {
  getPrices: () => request('/api/market-prices'),
  getNearbyMarkets: () => request('/api/nearby-markets'),
};

// ─── Policies ────────────────────────────────────────────────────────────────

export const policiesAPI = {
  getAll: () => request('/api/policies'),
};

// ─── Tips ────────────────────────────────────────────────────────────────────

export const tipsAPI = {
  getAll: () => request('/api/tips'),
};

// ─── Crop Scans ──────────────────────────────────────────────────────────────

export const cropScansAPI = {
  getAll: () => request('/api/crop-scans'),
  create: (image_url) =>
    request('/api/crop-scans', { method: 'POST', body: JSON.stringify({ image_url }) }),
  update: (id, data) =>
    request(`/api/crop-scans/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};

// ─── Yield Predictions ───────────────────────────────────────────────────────

export const yieldAPI = {
  getAll: () => request('/api/yield-predictions'),
  create: (data) =>
    request('/api/yield-predictions', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) =>
    request(`/api/yield-predictions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};

// ─── Chat ────────────────────────────────────────────────────────────────────

export const chatAPI = {
  getMessages: (conversationId) =>
    request(`/api/chat/messages/${conversationId}`),
  saveMessage: (data) =>
    request('/api/chat/messages', { method: 'POST', body: JSON.stringify(data) }),
};

// ─── Dealer ──────────────────────────────────────────────────────────────────

export const dealerAPI = {
  getBuyOffers: () => request('/api/dealer/buy-offers'),
  createBuyOffer: (data) =>
    request('/api/dealer/buy-offers', { method: 'POST', body: JSON.stringify(data) }),
  deleteBuyOffer: (id) =>
    request(`/api/dealer/buy-offers/${id}`, { method: 'DELETE' }),

  getInventory: () => request('/api/dealer/inventory'),
  addInventory: (data) =>
    request('/api/dealer/inventory', { method: 'POST', body: JSON.stringify(data) }),
  deleteInventory: (id) =>
    request(`/api/dealer/inventory/${id}`, { method: 'DELETE' }),

  getOrders: () => request('/api/dealer/orders'),
  createOrder: (data) =>
    request('/api/dealer/orders', { method: 'POST', body: JSON.stringify(data) }),
  updateOrderStatus: (id, status) =>
    request(`/api/dealer/orders/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }),

  getFarmers: () => request('/api/dealer/farmers'),
};

// ─── AI ──────────────────────────────────────────────────────────────────────

export const aiAPI = {
  analyzeCrop: (imageInput, language = 'en') => {
    const isBase64 = imageInput && (imageInput.startsWith('data:') || imageInput.length > 200);
    const body = isBase64
      ? { imageData: imageInput, language }
      : { imageUrl: imageInput, language };
    return request('/api/ai/analyze-crop', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  predictYield: (data) =>
    request('/api/ai/predict-yield', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  farmChatStream: (messages) => {
    // Use token-based auth in URL for EventSource (doesn't support headers)
    const token = getToken();
    const sse = new EventSource(
      `${BASE_URL}/api/ai/farm-chat?token=${token}`,
    );
    return sse;
  },

  farmChatFetch: async (messages, onChunk) => {
    const token = getToken();
    const res = await fetch(`${BASE_URL}/api/ai/farm-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ messages }),
    });

    if (!res.ok) throw new Error('Chat request failed');
    if (!res.body) return;

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.text) onChunk(data.text);
          } catch { /* skip malformed */ }
        }
      }
    }
  },
};

// ─── Convenience aliases ─────────────────────────────────────────────────────
export const nearbyMarketsAPI = {
  getAll: () => marketAPI.getNearbyMarkets(),
};

export const yieldPredictionsAPI = {
  create: (data) => yieldAPI.create(data),
};
