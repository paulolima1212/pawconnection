import { apiRequest } from '@/lib/api/client';

export const REPORT_REASONS = [
  'spam',
  'harassment',
  'inappropriate',
  'hate',
  'other',
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];

export const REPORT_REASON_LABELS: Record<ReportReason, { label: string; hint: string }> = {
  spam: { label: 'Spam', hint: 'Repetitive, misleading, or promotional' },
  harassment: { label: 'Harassment', hint: 'Bullying, threats, or targeted abuse' },
  inappropriate: { label: 'Inappropriate', hint: 'Nudity, violence, or unsafe content' },
  hate: { label: 'Hate', hint: 'Hate speech or discrimination' },
  other: { label: 'Something else', hint: 'Another safety concern' },
};

export type ReportPostResponse = {
  reported: true;
  reportId: string;
  duplicate: boolean;
};

export function reportPost(
  postId: string,
  reason: ReportReason,
  details?: string,
) {
  return apiRequest<ReportPostResponse>(`/feed/posts/${postId}/report`, {
    method: 'POST',
    body: { reason, details },
  });
}

export function blockUser(userId: string) {
  return apiRequest<{ blocked: true }>(`/users/${userId}/block`, { method: 'POST' });
}

export function unblockUser(userId: string) {
  return apiRequest<{ unblocked: true }>(`/users/${userId}/block`, { method: 'DELETE' });
}

export type BlockedUserApi = {
  id: string;
  fullName: string;
  handle: string;
  photoUrl: string | null;
  blockedAt: string;
};

export function listBlockedUsers() {
  return apiRequest<{ items: BlockedUserApi[] }>('/blocks');
}
