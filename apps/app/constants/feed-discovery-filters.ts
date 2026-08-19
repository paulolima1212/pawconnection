/** Radius filter labels relative to the user’s location (Figma social feed). */
export const FEED_RADIUS_OPTIONS = [
  { value: '', label: 'Worldwide' },
  { value: '1', label: '+ 1 km' },
  { value: '2', label: '+ 2 km' },
  { value: '5', label: '+ 5 km' },
  { value: '10', label: '+ 10 km' },
  { value: '25', label: '+ 25 km' },
  { value: '50', label: '+ 50 km' },
] as const;

export type FeedRadiusKm = (typeof FEED_RADIUS_OPTIONS)[number]['value'];

export const FEED_CITY_ALL_OPTION = { value: '', label: 'All areas' } as const;

export const FEED_POST_SCOPE_OPTIONS = [
  { value: 'all' as const, label: 'All posts' },
  { value: 'friends' as const, label: "Friends' posts" },
  { value: 'mine' as const, label: 'My posts' },
] as const;

export type FeedPostScope = (typeof FEED_POST_SCOPE_OPTIONS)[number]['value'];
