import { Redirect } from 'expo-router';

import { useSession } from '@/lib/session';

// Entry point: send people to the right place for their sign-in state.
export default function Index() {
  const { status } = useSession();
  return <Redirect href={status === 'signedIn' ? '/home' : '/welcome'} />;
}
