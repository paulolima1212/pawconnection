import { apiRequest } from '@/lib/api/client';
import type { InboxRequestApi } from '@/lib/api/types';

export function listInboxRequests(params?: {
  type?: 'romance' | 'friendship' | 'request';
  direction?: 'incoming' | 'outgoing';
}) {
  const query = new URLSearchParams();
  if (params?.type) query.set('type', params.type);
  if (params?.direction) query.set('direction', params.direction);
  const qs = query.toString();
  return apiRequest<InboxRequestApi[]>(`/inbox/requests${qs ? `?${qs}` : ''}`);
}

export function acceptInboxRequest(id: string) {
  return apiRequest(`/inbox/requests/${id}/accept`, { method: 'POST' });
}

export function rejectInboxRequest(id: string) {
  return apiRequest(`/inbox/requests/${id}/reject`, { method: 'POST' });
}

export function createConnectionRequest(recipientId: string, lookingFor: string) {
  return apiRequest<InboxRequestApi>('/inbox/requests', {
    method: 'POST',
    body: { recipientId, lookingFor },
  });
}
