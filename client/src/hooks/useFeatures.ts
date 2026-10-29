import { useQuery } from '@tanstack/react-query';
import { featuresApi } from '../services/api';

/**
 * Which features the API has switched on. Defaults to everything off while loading
 * or if the call fails, so unreleased features never flash up by mistake.
 */
export function useFeatures() {
  const { data, isLoading } = useQuery({
    queryKey: ['features'],
    queryFn: featuresApi.get,
    staleTime: 5 * 60_000,
  });
  return { jobPrep: data?.jobPrep ?? false, accounts: data?.accounts ?? false, isLoading };
}
