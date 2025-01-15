import { FilterPresets } from '../types';

export const getPresetFilters = (
  presetKey: string,
  presets?: FilterPresets
): Record<string, any> | null => {
  if (!presets) return null;

  try {
    switch (presetKey) {
      case 'today': {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return {
          dateRange: presets.dateRanges.today(),
        };
      }

      case 'lastWeek': {
        return {
          dateRange: presets.dateRanges.lastWeek(),
        };
      }

      case 'lastMonth': {
        return {
          dateRange: presets.dateRanges.lastMonth(),
        };
      }

      case 'sortByNameAsc': {
        return {
          sort: presets.sorts.nameAsc,
        };
      }

      case 'sortByNameDesc': {
        return {
          sort: presets.sorts.nameDesc,
        };
      }

      case 'sortByDateAsc': {
        return {
          sort: presets.sorts.dateAsc,
        };
      }

      case 'sortByDateDesc': {
        return {
          sort: presets.sorts.dateDesc,
        };
      }

      default:
        return null;
    }
  } catch (error) {
    console.error('Error applying preset filters:', error);
    return null;
  }
};
