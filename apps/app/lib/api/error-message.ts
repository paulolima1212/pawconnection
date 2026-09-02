/** True when the API error is a missing chat route, not a generic 404. */
export function isMissingChatRouteError(message: string): boolean {
  return (
    /Cannot (GET|POST|PUT|PATCH|DELETE)\s+\/(conversations|messages)\b/i.test(message) ||
    /\/messages\/[^/\s]+\/reactions/i.test(message)
  );
}
