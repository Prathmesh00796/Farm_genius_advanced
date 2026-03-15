// Central API client — all calls go through here
const BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.DEV ? 'http://127.0.0.1:8000' : 'https://farm-genius-advanced.onrender.com');

function getToken(): string | null {
  return localStorage.getItem('farmgenius_token');
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
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
    console.error(`API Error (${path}):`, detail);
    throw new Error(detail);
  }

  // Some DELETE endpoints return empty body
  const text = await res.text();
  return text ? JSON.parse(text) as T : ({} as T);
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthToken {
  access_token: string;
  token_type: string;
  user_id: string;
  role: string;
}

export interface Me {
  id: string;
  email: string;
  role: string;
  full_name: string;
  phone?: string;
  village_city?: string;
  avatar_url?: string;
}

export const authAPI = {
  register: (body: {
    email: string;
    password: string;
    full_name: string;
    phone?: string;
    village_city?: string;
    role?: string;
  }) => request<AuthToken>('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),

  login: (email: string, password: string) =>
    request<AuthToken>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  me: () => request<Me>('/api/auth/me'),
};

// ─── Profiles ─────────────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  phone?: string;
  email?: string;
  village_city?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export const profilesAPI = {
  get: (userId: string) => request<Profile>(`/api/profiles/${userId}`),
  update: (userId: string, data: Partial<Profile>) =>
    request<Profile>(`/api/profiles/${userId}`, { method: 'PUT', body: JSON.stringify(data) }),
};

// ─── Market Prices ────────────────────────────────────────────────────────────

export interface MarketPrice {
  id: string;
  crop: string;
  variety: string;
  market: string;
  location: string;
  price_per_quintal: number;
  trend_percentage?: number;
  updated_at: string;
}

export const marketAPI = {
  getPrices: () => request<MarketPrice[]>('/api/market-prices'),
  getNearbyMarkets: () => request<NearbyMarket[]>('/api/nearby-markets'),
};

// ─── Nearby Markets ──────────────────────────────────────────────────────────

export interface NearbyMarket {
  id: string;
  name: string;
  address: string;
  phone?: string;
  opening_hours?: string;
  available_crops?: string[];
  rating?: number;
  latitude?: number;
  longitude?: number;
}

// ─── Policies ────────────────────────────────────────────────────────────────

export interface Policy {
  id: string;
  title: string;
  description: string;
  category: string;
  published_date: string;
  link?: string;
  created_at: string;
}

export const policiesAPI = {
  getAll: () => request<Policy[]>('/api/policies'),
};

// ─── Tips ────────────────────────────────────────────────────────────────────

export interface Tip {
  id: string;
  title: string;
  content: string;
  category: string;
  is_alert: boolean;
  published_at: string;
}

export const tipsAPI = {
  getAll: () => request<Tip[]>('/api/tips'),
};

// ─── Crop Scans ──────────────────────────────────────────────────────────────

export interface CropScan {
  id: string;
  user_id: string;
  image_url: string;
  disease_name?: string;
  confidence?: number;
  description?: string;
  recommendations?: string[];
  severity?: string;
  affected_parts?: string;
  created_at: string;
}

export const cropScansAPI = {
  getAll: () => request<CropScan[]>('/api/crop-scans'),
  create: (image_url: string) =>
    request<CropScan>('/api/crop-scans', { method: 'POST', body: JSON.stringify({ image_url }) }),
  update: (id: string, data: Partial<CropScan>) =>
    request<CropScan>(`/api/crop-scans/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};

// ─── Yield Predictions ───────────────────────────────────────────────────────

export interface YieldPrediction {
  id: string;
  user_id: string;
  crop_type: string;
  soil_type: string;
  area_acres: number;
  sowing_date: string;
  irrigation_type: string;
  fertilizer_used: string;
  estimated_yield?: number;
  harvest_days?: number;
  estimated_revenue?: number;
  comparison_to_avg?: string;
  recommendations?: Array<{ title: string; description: string }>;
  risk_factors?: string[];
  optimal_harvest_date?: string;
  created_at: string;
}

export const yieldAPI = {
  getAll: () => request<YieldPrediction[]>('/api/yield-predictions'),
  create: (data: Omit<YieldPrediction, 'id' | 'user_id' | 'created_at'>) =>
    request<YieldPrediction>('/api/yield-predictions', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<YieldPrediction>) =>
    request<YieldPrediction>(`/api/yield-predictions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};

// ─── Chat ────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  user_id: string;
  conversation_id: string;
  role: string;
  content: string;
  created_at: string;
}

export const chatAPI = {
  getMessages: (conversationId: string) =>
    request<ChatMessage[]>(`/api/chat/messages/${conversationId}`),
  saveMessage: (data: { conversation_id: string; role: string; content: string }) =>
    request<ChatMessage>('/api/chat/messages', { method: 'POST', body: JSON.stringify(data) }),
};

// ─── Dealer ──────────────────────────────────────────────────────────────────

export interface BuyOffer {
  id: string;
  dealer_id: string;
  crop_type: string;
  variety?: string;
  quantity_quintals: number;
  price_per_quintal: number;
  quality_requirements?: string;
  location?: string;
  valid_until?: string;
  status: string;
  created_at: string;
}

export interface InventoryItem {
  id: string;
  dealer_id: string;
  crop_type: string;
  variety?: string;
  quantity_quintals: number;
  purchase_price?: number;
  selling_price?: number;
  storage_location?: string;
  purchase_date?: string;
  notes?: string;
  created_at: string;
}

export interface DealerOrder {
  id: string;
  dealer_id: string;
  farmer_id?: string;
  crop_type: string;
  variety?: string;
  quantity_quintals: number;
  price_per_quintal: number;
  total_amount?: number;
  status: string;
  farmer_name?: string;
  farmer_village?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Farmer {
  id: string;
  full_name: string;
  phone?: string;
  village_city?: string;
  email?: string;
}

export const dealerAPI = {
  getBuyOffers: () => request<BuyOffer[]>('/api/dealer/buy-offers'),
  createBuyOffer: (data: Omit<BuyOffer, 'id' | 'dealer_id' | 'status' | 'created_at'>) =>
    request<BuyOffer>('/api/dealer/buy-offers', { method: 'POST', body: JSON.stringify(data) }),
  deleteBuyOffer: (id: string) =>
    request<{}>(`/api/dealer/buy-offers/${id}`, { method: 'DELETE' }),

  getInventory: () => request<InventoryItem[]>('/api/dealer/inventory'),
  addInventory: (data: Omit<InventoryItem, 'id' | 'dealer_id' | 'created_at'>) =>
    request<InventoryItem>('/api/dealer/inventory', { method: 'POST', body: JSON.stringify(data) }),
  deleteInventory: (id: string) =>
    request<{}>(`/api/dealer/inventory/${id}`, { method: 'DELETE' }),

  getOrders: () => request<DealerOrder[]>('/api/dealer/orders'),
  createOrder: (data: Omit<DealerOrder, 'id' | 'dealer_id' | 'total_amount' | 'status' | 'created_at' | 'updated_at'>) =>
    request<DealerOrder>('/api/dealer/orders', { method: 'POST', body: JSON.stringify(data) }),
  updateOrderStatus: (id: string, status: string) =>
    request<DealerOrder>(`/api/dealer/orders/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }),

  getFarmers: () => request<Farmer[]>('/api/dealer/farmers'),
};

// ─── AI ──────────────────────────────────────────────────────────────────────

export interface CropAnalysisResult {
  disease_name: string;
  confidence: number;
  severity: string;
  affected_parts: string;
  description: string;
  symptoms: string[];
  chemical_treatment: string[];
  organic_treatment: string[];
  preventive_measures: string[];
  economic_impact: string;
  spread_risk: string;
  best_time_to_spray: string;
  when_to_consult_expert: string;
  tts_summary: string;
  all_language_names?: Record<string, string>;
  model_used?: string;
}

export interface YieldPredictionResult {
  estimated_yield: number;
  harvest_days: number;
  estimated_revenue: number;
  comparison_to_avg: string;
  optimal_harvest_date: string;
  recommendations: Array<{ title: string; description: string }>;
  risk_factors: string[];
}

export const aiAPI = {
  analyzeCrop: (imageInput: string, language: string = 'en') => {
    const isBase64 = imageInput.startsWith('data:') || imageInput.length > 200;
    const body = isBase64
      ? { imageData: imageInput, language }
      : { imageUrl: imageInput, language };
    return request<CropAnalysisResult>('/api/ai/analyze-crop', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  predictYield: (data: {
    cropType: string;
    soilType: string;
    areaAcres: number;
    sowingDate: string;
    irrigationType: string;
    fertilizerUsed: string;
    language?: string;
  }) =>
    request<YieldPredictionResult>('/api/ai/predict-yield', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  farmChatStream: (messages: Array<{ role: string; content: string }>): EventSource => {
    // Use token-based auth in URL for EventSource (doesn't support headers)
    const token = getToken();
    const sse = new EventSource(
      `${BASE_URL}/api/ai/farm-chat?token=${token}`,
    );
    return sse;
  },

  farmChatFetch: async (
    messages: Array<{ role: string; content: string }>,
    onChunk: (text: string) => void
  ): Promise<void> => {
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
  create: (data: Omit<YieldPrediction, 'id' | 'user_id' | 'created_at'>) =>
    yieldAPI.create(data),
};

