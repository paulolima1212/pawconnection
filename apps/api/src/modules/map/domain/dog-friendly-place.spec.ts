import { AppInterest } from '../../../shared/domain/types';
import {
  categoryOfPlace,
  featuredPlaceCategory,
  includedTypesForFilter,
  isDogFriendlyPlace,
  matchesIncludedTypes,
  parsePlaceFilter,
  rankDogFriendlyPlaces,
  resolvePlacesRadiusKm,
  type PlaceCandidate,
  type ViewerPlaceProfile,
} from './dog-friendly-place';

const servicesOnly: ViewerPlaceProfile = {
  interests: [AppInterest.DogServices],
  enjoysPark: false,
  enjoysWater: false,
  enjoysWalks: false,
};

const playdates: ViewerPlaceProfile = {
  interests: [AppInterest.DogPlaydates],
  enjoysPark: true,
  enjoysWater: false,
  enjoysWalks: true,
};

const locations: ViewerPlaceProfile = {
  interests: [AppInterest.DogFriendlyLocations],
  enjoysPark: false,
  enjoysWater: false,
  enjoysWalks: false,
};

function place(partial: Partial<PlaceCandidate> & Pick<PlaceCandidate, 'id' | 'name'>): PlaceCandidate {
  return {
    latitude: -33.86,
    longitude: 151.21,
    types: [],
    primaryType: null,
    allowsDogs: null,
    address: null,
    ...partial,
  };
}

describe('resolvePlacesRadiusKm', () => {
  it('defaults worldwide or missing radius to 5 km', () => {
    expect(resolvePlacesRadiusKm(undefined)).toBe(5);
    expect(resolvePlacesRadiusKm(0)).toBe(5);
    expect(resolvePlacesRadiusKm(Number.NaN)).toBe(5);
  });

  it('clamps to 1–50 km', () => {
    expect(resolvePlacesRadiusKm(0.4)).toBe(5);
    expect(resolvePlacesRadiusKm(1)).toBe(1);
    expect(resolvePlacesRadiusKm(80)).toBe(50);
  });
});

describe('parsePlaceFilter', () => {
  it('defaults unknown values to forYou', () => {
    expect(parsePlaceFilter(undefined)).toBe('forYou');
    expect(parsePlaceFilter('nope')).toBe('forYou');
    expect(parsePlaceFilter('parks')).toBe('parks');
  });
});

describe('featuredPlaceCategory', () => {
  it('features services when the owner only chose dog services', () => {
    expect(featuredPlaceCategory(servicesOnly)).toBe('services');
  });

  it('features parks for playdates and park-loving dogs', () => {
    expect(featuredPlaceCategory(playdates)).toBe('parks');
  });

  it('features parks for dog-friendly locations', () => {
    expect(featuredPlaceCategory(locations)).toBe('parks');
  });

  it('features parks when All the above plus park enjoyment', () => {
    expect(
      featuredPlaceCategory({
        interests: [AppInterest.AllTheAbove],
        enjoysPark: true,
        enjoysWater: false,
        enjoysWalks: false,
      }),
    ).toBe('parks');
  });
});

describe('includedTypesForFilter', () => {
  it('uses Google types for an explicit category chip', () => {
    expect(includedTypesForFilter('services', playdates)).toEqual([
      'veterinary_care',
      'pet_store',
    ]);
  });

  it('personalizes For you from interests and pet prefs', () => {
    expect(includedTypesForFilter('forYou', servicesOnly)).toEqual([
      'dog_park',
      'veterinary_care',
      'pet_store',
    ]);
    expect(includedTypesForFilter('forYou', playdates)).toEqual(['dog_park', 'park']);
    expect(includedTypesForFilter('forYou', locations)).toContain('cafe');
    expect(includedTypesForFilter('forYou', locations)).toContain('park');
  });
});

describe('isDogFriendlyPlace', () => {
  it('always keeps inherent dog businesses and dog parks', () => {
    expect(isDogFriendlyPlace(place({ id: '1', name: 'Vet', types: ['veterinary_care'] }))).toBe(
      true,
    );
    expect(isDogFriendlyPlace(place({ id: '2', name: 'Off-leash', types: ['dog_park'] }))).toBe(
      true,
    );
  });

  it('keeps cafes only when Google marks them as allowing dogs', () => {
    expect(
      isDogFriendlyPlace(place({ id: '3', name: 'Cafe', types: ['cafe'], allowsDogs: null })),
    ).toBe(false);
    expect(
      isDogFriendlyPlace(place({ id: '4', name: 'Pup cafe', types: ['cafe'], allowsDogs: true })),
    ).toBe(true);
  });

  it('drops parks that explicitly disallow dogs and keeps unknown parks', () => {
    expect(
      isDogFriendlyPlace(place({ id: '5', name: 'Reserve', types: ['park'], allowsDogs: false })),
    ).toBe(false);
    expect(
      isDogFriendlyPlace(place({ id: '6', name: 'Oval', types: ['park'], allowsDogs: null })),
    ).toBe(true);
  });
});

describe('matchesIncludedTypes', () => {
  it('keeps only places whose Google type was requested', () => {
    expect(
      matchesIncludedTypes(place({ id: 'v', name: 'Vet', types: ['veterinary_care'] }), [
        'veterinary_care',
        'pet_store',
      ]),
    ).toBe(true);
    expect(
      matchesIncludedTypes(place({ id: 'p', name: 'Park', types: ['park'] }), [
        'veterinary_care',
        'pet_store',
      ]),
    ).toBe(false);
  });
});

describe('categoryOfPlace', () => {
  it('maps Google types onto product categories', () => {
    expect(categoryOfPlace({ types: ['cafe'], primaryType: 'cafe' })).toBe('cafes');
    expect(categoryOfPlace({ types: ['veterinary_care'], primaryType: null })).toBe('services');
    expect(categoryOfPlace({ types: ['dog_park'], primaryType: 'dog_park' })).toBe('parks');
  });
});

describe('rankDogFriendlyPlaces', () => {
  it('surfaces the featured category first, then closer pins', () => {
    const ranked = rankDogFriendlyPlaces(
      [
        { ...place({ id: 'cafe', name: 'Far cafe', types: ['cafe'], allowsDogs: true }), distanceKm: 1 },
        { ...place({ id: 'vet', name: 'Near vet', types: ['veterinary_care'] }), distanceKm: 0.4 },
        { ...place({ id: 'park', name: 'Park', types: ['park'] }), distanceKm: 2 },
      ],
      servicesOnly,
      'services',
    );
    expect(ranked.map((p) => p.id)).toEqual(['vet', 'cafe', 'park']);
    expect(ranked[0].featured).toBe(true);
  });

  it('boosts water-named places when the dog enjoys water', () => {
    const ranked = rankDogFriendlyPlaces(
      [
        { ...place({ id: 'oval', name: 'Sports oval', types: ['park'] }), distanceKm: 0.5 },
        { ...place({ id: 'bay', name: 'Bay beach', types: ['park'] }), distanceKm: 0.8 },
      ],
      { ...playdates, enjoysWater: true },
      'parks',
    );
    expect(ranked[0].id).toBe('bay');
  });
});
