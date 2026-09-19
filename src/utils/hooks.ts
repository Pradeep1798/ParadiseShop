import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';

export function useFocusRefresh(
  loader: () => Promise<void>,
  deps: readonly unknown[] = [],
) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loader().finally(() => setLoading(false));
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loader();
    setRefreshing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { loading, refreshing, onRefresh };
}