let activeConversationId: string | null = null;

export function setActiveChatConversationId(conversationId: string | null): void {
  activeConversationId = conversationId;
}

export function getActiveChatConversationId(): string | null {
  return activeConversationId;
}
