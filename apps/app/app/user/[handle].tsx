import { useLocalSearchParams } from 'expo-router';

import { PublicProfileScreen } from '@/components/screens/public-profile-screen';

export default function UserProfileRoute() {
  const { handle } = useLocalSearchParams<{ handle: string }>();
  const resolved = typeof handle === 'string' ? handle : Array.isArray(handle) ? handle[0] : '';
  return <PublicProfileScreen handle={resolved ?? ''} />;
}
