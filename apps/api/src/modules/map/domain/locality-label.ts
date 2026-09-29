/**
 * Turns a place prediction into "Neighborhood, City - State - Country"
 * or "City - State - Country" when the user typed the city itself.
 */
export function formatLocalityLabel(
  mainText: string,
  secondaryText: string | null | undefined,
): string {
  const main = mainText.trim();
  const secondaryParts = (secondaryText ?? '')
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  if (!main) return secondaryParts.join(' - ');
  if (secondaryParts.length === 0) return main;

  const secondary = secondaryParts.join(' - ');
  const neighborhood = secondaryParts[0]?.includes(' - ') ?? false;
  return neighborhood ? `${main}, ${secondary}` : `${main} - ${secondary}`;
}
