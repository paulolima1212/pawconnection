import { LocalityPrediction } from './ports/locality-search.port';

export type NominatimAddress = {
  neighbourhood?: string;
  suburb?: string;
  city_district?: string;
  city?: string;
  town?: string;
  municipality?: string;
  village?: string;
  state?: string;
  stateCode?: string | null;
  country?: string;
};

/** Keeps letter codes such as RJ and drops numeric ISO suffixes such as 82. */
export function regionAbbreviation(code: string | null | undefined): string | undefined {
  const suffix = code?.split('-').pop()?.trim() ?? '';
  if (/^[A-Za-z]{2,3}$/.test(suffix)) return suffix.toUpperCase();
  return undefined;
}

function first(...values: Array<string | undefined>): string {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return '';
}

/** City or neighborhood plus the rest of the place, ready for the label formatter. */
export function localityFromAddress(
  address: NominatimAddress,
): LocalityPrediction | null {
  const city = first(
    address.city,
    address.town,
    address.municipality,
    address.village,
  );
  const neighborhood = first(
    address.neighbourhood,
    address.suburb,
    address.city_district,
  );
  const region = first(regionAbbreviation(address.stateCode), address.state);
  const country = address.country?.trim() ?? '';
  const place = neighborhood && neighborhood !== city ? neighborhood : city;
  if (!place) return null;

  const rest = [region, country].filter((part) => part.length > 0);
  if (neighborhood && neighborhood !== city && city) {
    const secondary = [city, ...rest].join(', ');
    const withCityDash = secondary.replace(`${city}, `, `${city} - `);
    return { mainText: neighborhood, secondaryText: withCityDash };
  }
  return {
    mainText: place,
    secondaryText: rest.length > 0 ? rest.join(', ') : null,
  };
}
