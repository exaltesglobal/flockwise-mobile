import { Serving } from '@/api/endpoints';
import type { MyServing } from '@/api/types';

import { useSession } from './session';
import { useApi } from './use-api';

export type ServingItem = MyServing['assignments'][number];

/** The signed-in person's own rota and away dates for the team they signed in for. */
export function useMyServing() {
  const { session } = useSession();
  const teamId = session?.team.id ?? '';
  return useApi(() => Serving.mine(teamId), [teamId]);
}
