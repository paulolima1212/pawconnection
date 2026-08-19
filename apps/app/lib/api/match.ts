import { apiRequest } from '@/lib/api/client';
import type { MatchCandidatesResponseApi } from '@/constants/match-feed';
import * as chatApi from '@/lib/api/chat';

export function listMatchCandidates(options?: {
  radiusKm?: number;
  expandRadius?: boolean;
}) {
  const query = new URLSearchParams();
  if (options?.radiusKm != null) query.set('radiusKm', String(options.radiusKm));
  if (options?.expandRadius === false) query.set('expandRadius', 'false');
  const qs = query.toString();
  return apiRequest<MatchCandidatesResponseApi>(
    `/match/candidates${qs ? `?${qs}` : ''}`,
  );
}

export function passMatchCandidate(userId: string) {
  return apiRequest<{ ok: boolean }>(`/match/candidates/${encodeURIComponent(userId)}/pass`, {
    method: 'POST',
  });
}

export function recordMatchWave(userId: string) {
  return apiRequest<{ wave: boolean }>(
    `/match/candidates/${encodeURIComponent(userId)}/wave`,
    { method: 'POST' },
  );
}

/** Sends chat message + friendship request (via wave) without opening the chat screen. */
export async function sendMatchWave(params: {
  recipientId: string;
  handle: string;
  message: string;
}) {
  const content = params.message.trim();
  if (!content) {
    throw new Error('Message is required');
  }

  const conversation = await chatApi.startConversationWithProfile({
    id: params.recipientId,
    handle: params.handle,
  });
  await chatApi.sendMessage(conversation.id, { content });
  await recordMatchWave(params.recipientId);
  return conversation;
}
