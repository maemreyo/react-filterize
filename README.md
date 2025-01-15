# @matthew.ngo/react-filter-hooks Documentation

## Table of Contents
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Best Practices](#best-practices)
- [Examples](#examples)
- [API Reference](#api-reference)

## Installation

```bash
npm install @matthew.ngo/react-filter-hooks
# or
yarn add @matthew.ngo/react-filter-hooks
```

## Quick Start

```tsx
import { useFilterize } from '@matthew.ngo/react-filter-hooks';

const MyComponent = () => {
  const { filters, updateFilter, loading, data } = useFilterize({
    filtersConfig: [
      {
        key: 'search',
        type: 'query',
        defaultValue: '',
        debounce: 300
      },
      {
        key: 'dateRange',
        type: 'dateRange',
        defaultValue: [new Date(), new Date()]
      }
    ],
    fetchData: async (filters) => {
      const response = await fetch('/api/data?' + new URLSearchParams(filters));
      return response.json();
    }
  });

  return (
    <div>
      <input 
        type="text" 
        value={filters.search || ''} 
        onChange={(e) => updateFilter('search', e.target.value)} 
      />
      {/* Rest of your UI */}
    </div>
  );
};
```

## Best Practices

### 1. Filter Configuration
- **Organize filters by groups** for better maintainability:
```tsx
const filterGroups = [
  {
    key: 'basic',
    label: 'Basic Filters',
    filters: ['search', 'status']
  },
  {
    key: 'advanced',
    label: 'Advanced Filters',
    filters: ['dateRange', 'tags']
  }
];
```

- **Use meaningful keys** that reflect the filter's purpose:
```tsx
// Good
const filtersConfig = [
  { key: 'statusFilter', type: 'select' },
  { key: 'dateRangeFilter', type: 'dateRange' }
];

// Avoid
const filtersConfig = [
  { key: 'filter1', type: 'select' },
  { key: 'filter2', type: 'dateRange' }
];
```

### 2. Performance Optimization
- **Use appropriate debounce values** for text inputs:
```tsx
{
  key: 'search',
  type: 'query',
  debounce: 300, // Good for search
  validation: (value) => value.length >= 2
}
```

- **Implement proper caching strategies**:
```tsx
const { filters, updateFilter } = useFilterize({
  options: {
    cacheTimeout: 5 * 60 * 1000, // 5 minutes
    persistFilters: true
  }
});
```

### 3. Error Handling
- **Always implement validation**:
```tsx
const filtersConfig = [
  {
    key: 'age',
    type: 'numberRange',
    validation: ([min, max]) => {
      if (min < 0) return false;
      if (max > 120) return false;
      return min <= max;
    }
  }
];
```

### 4. URL Synchronization
- **Enable URL sync for shareable filters**:
```tsx
const { filters } = useFilterize({
  options: {
    syncWithUrl: true
  }
});
```

## Examples

### 1. Advanced Search with Multiple Filter Types

```tsx
import { useFilterize } from '@matthew.ngo/react-filter-hooks';

const AdvancedSearch = () => {
  const {
    filters,
    updateFilter,
    loading,
    data,
    filterHooks
  } = useFilterize({
    filtersConfig: [
      {
        key: 'search',
        type: 'query',
        defaultValue: '',
        debounce: 300,
        transform: (value) => value.toLowerCase().trim()
      },
      {
        key: 'status',
        type: 'select',
        defaultValue: 'all',
        validation: (value) => ['all', 'active', 'inactive'].includes(value)
      },
      {
        key: 'dateRange',
        type: 'dateRange',
        defaultValue: [new Date(), new Date()],
        validation: ([start, end]) => start <= end
      },
      {
        key: 'tags',
        type: 'multiSelect',
        defaultValue: [],
        validation: (values) => values.length <= 5
      }
    ],
    fetchData: async (filters) => {
      // Your API call here
    },
    options: {
      syncWithUrl: true,
      persistFilters: true,
      enableAnalytics: true
    }
  });

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <input
        type="text"
        value={filters.search || ''}
        onChange={(e) => updateFilter('search', e.target.value)}
        placeholder="Search..."
      />

      <select
        value={filters.status}
        onChange={(e) => updateFilter('status', e.target.value)}
      >
        <option value="all">All</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>

      {/* Date Range Picker Example */}
      <DateRangePicker
        startDate={filters.dateRange?.[0]}
        endDate={filters.dateRange?.[1]}
        onChange={([start, end]) => updateFilter('dateRange', [start, end])}
      />

      {/* Multi-select Tags Example */}
      <TagSelect
        selected={filters.tags}
        onChange={(tags) => updateFilter('tags', tags)}
        maxTags={5}
      />

      {/* Results */}
      <div>
        {data?.map((item) => (
          <div key={item.id}>{/* Render your items */}</div>
        ))}
      </div>
    </div>
  );
};
```

### 2. Analytics Integration

```tsx
const SearchWithAnalytics = () => {
  const {
    filters,
    updateFilter,
    analytics
  } = useFilterize({
    // ... filter config
    options: {
      enableAnalytics: true
    }
  });

  // Get analytics report periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const report = analytics?.getAnalyticsReport();
      console.log('Filter Usage Report:', report);
    }, 60000);

    return () => clearInterval(interval);
  }, [analytics]);

  return (
    <div>
      {/* Your filter UI */}
      <AnalyticsDashboard analytics={analytics} />
    </div>
  );
};
```

## API Reference

### useFilterize
Main hook for managing filters.

```tsx
interface UseFilterizeProps<T extends FilterTypes> {
  filtersConfig: FilterConfig<T>[];
  fetchData: (filters: Record<string, any>) => Promise<any>;
  options?: {
    syncWithUrl?: boolean;
    persistFilters?: boolean;
    enableAnalytics?: boolean;
    cacheTimeout?: number;
  };
  presets?: FilterPresets;
  groups?: FilterGroup[];
}
```

### useQueryFilter
Hook for text search filters.

```tsx
interface UseQueryFilterProps {
  defaultValue?: string;
  debounce?: number;
  transform?: (value: string) => any;
  validation?: (value: string) => boolean;
}
```

### useRangeFilter
Hook for numeric or date ranges.

```tsx
interface UseRangeFilterProps<T extends number | Date> {
  defaultValue?: [T, T];
  min?: T;
  max?: T;
  step?: number;
  validation?: (range: [T, T]) => boolean;
}
```

### useSelectFilter
Hook for single or multi-select filters.

```tsx
interface UseSelectFilterProps<T> {
  defaultValue?: T;
  options?: T[];
  isMulti?: boolean;
  validation?: (value: T | T[]) => boolean;
}
```