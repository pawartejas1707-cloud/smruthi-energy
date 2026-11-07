const API_BASE = '/api';

export async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
      ...options,
    });
    if (!res.ok) {
      throw new Error(`API Error: ${res.statusText}`);
    }
    return (await res.json()) as T;
  } catch (err) {
    // If backend is not running or unreachable, return null for offline fallback
    return null;
  }
}

export const api = {
  checkHealth: () => fetchApi<{ status: string }>('/health'),
  getSections: () => fetchApi<any[]>('/sections'),
  updateSectionLimit: (id: string, dailyLimitKwh: number) =>
    fetchApi(`/sections/${id}/limit`, {
      method: 'PUT',
      body: JSON.stringify({ dailyLimitKwh }),
    }),
  addMeter: (sectionId: string, meterData: any) =>
    fetchApi(`/sections/${sectionId}/meters`, {
      method: 'POST',
      body: JSON.stringify(meterData),
    }),
  updateMeter: (sectionId: string, meterId: string, meterData: any) =>
    fetchApi(`/sections/${sectionId}/meters/${meterId}`, {
      method: 'PUT',
      body: JSON.stringify(meterData),
    }),
  getReadings: (params?: { date?: string; sectionId?: string; limit?: number }) => {
    const query = new URLSearchParams(params as any).toString();
    return fetchApi<any[]>(`/readings?${query}`);
  },
  addReading: (reading: any) =>
    fetchApi('/readings', {
      method: 'POST',
      body: JSON.stringify(reading),
    }),
  getTransformers: () => fetchApi<any[]>('/transformers'),
  addTransformer: (reading: any) =>
    fetchApi('/transformers', {
      method: 'POST',
      body: JSON.stringify(reading),
    }),
  getCosting: () => fetchApi<any>('/costing'),
  updateCosting: (data: any) =>
    fetchApi('/costing', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  getAlerts: () => fetchApi<any[]>('/alerts'),
  resolveAlert: (id: string) =>
    fetchApi(`/alerts/${id}/resolve`, {
      method: 'PUT',
    }),
  getEnquiries: () => fetchApi<any[]>('/enquiries'),
  sendEnquiry: (data: any) =>
    fetchApi('/enquiries', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  replyEnquiry: (id: string, replyMessage: string, repliedBy: string) =>
    fetchApi(`/enquiries/${id}/reply`, {
      method: 'PUT',
      body: JSON.stringify({ replyMessage, repliedBy }),
    }),
  getEmailConfig: () => fetchApi<any>('/email/config'),
  updateEmailConfig: (data: any) =>
    fetchApi('/email/config', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  sendTestEmail: (data: { sectionName?: string; recipient?: string }) =>
    fetchApi<any>('/email/test', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getEmailLogs: () => fetchApi<any[]>('/email/logs'),
};
