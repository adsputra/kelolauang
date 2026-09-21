import type { FilterState } from '../../types';

export function createInitialFilters(type: FilterState['type'] = 'all'): FilterState {
  return {
    search: '',
    type,
    category: 'all',
    dateRange: 'all',
    customStartDate: '',
    customEndDate: '',
  };
}
