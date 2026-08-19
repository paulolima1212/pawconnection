/** Returns the first grapheme from keyboard input (one system emoji). */
export function extractSingleEmoji(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
    const first = [...segmenter.segment(trimmed)][0]?.segment;
    return first?.trim() || null;
  }

  return [...trimmed][0] ?? null;
}
