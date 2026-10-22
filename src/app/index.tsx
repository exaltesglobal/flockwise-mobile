import { Redirect } from 'expo-router';

import { useSession } from '@/lib/session';

// Entry point: send people to the right place for their sign-in state.
export default function Index() {
  const { status, session } = useSession();
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  return <Redirect href={session?.mustChangePassword ? '/settings/password' : '/schedule'} />;
}
