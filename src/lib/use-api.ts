import { useCallback, useEffect, useState } from 'react';

import { ApiError } from '@/api/errors';

/** Minimal data-loading hook: loading / error / refresh for one API call. */
export function useApi<T>(load: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(load, deps);

  const fetchData = useCallback(
    async (isRefresh = false) => {
      isRefresh ? setRefreshing(true) : setLoading(true);
      try {
        setData(await run());
        setError(null);
      } catch (e) {
        setError(e instanceof ApiError ? e : new ApiError(0, 'unknown', String(e)));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [run],
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, setData, error, loading, refreshing, refresh: () => fetchData(true) };
}
