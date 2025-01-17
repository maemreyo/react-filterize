export interface FetchState {
  isInitialFetch: boolean;
  lastFetchedAt: number | null;
  preventedFetchCount: number;
  lastPreventedAt: number | null;
  missingRequiredFilters: string[];
}
