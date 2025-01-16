# @matthew.ngo/react-filterize Documentation

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Best Practices](#best-practices)
  - [1. Filter Configuration](#1-filter-configuration)
  - [2. Performance Optimization](#2-performance-optimization)
  - [3. Error Handling](#3-error-handling)
  - [4. URL Synchronization](#4-url-synchronization)
  - [5. Retry](#5-retry)
  - [6. Transformations](#6-transformations)
- [Examples](#examples)
  - [1. Advanced Search with Multiple Filter Types](#1-advanced-search-with-multiple-filter-types)
  - [2. Analytics Integration](#2-analytics-integration)
- [API Reference](#api-reference)
  - [useFilterize](#usefilterize)
  - [createFilterConfig](#createfilterconfig)
  - [Filter Options](#filter-options)
    - [Common Options](#common-options)
    - [Specific Options](#specific-options)
    - [Option Interfaces](#option-interfaces)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)
- [FAQs](#faqs)

## Installation

```bash
npm install @matthew.ngo/react-filterize
# or
yarn add @matthew.ngo/react-filterize
```

## Quick Start

```tsx
import React from 'react';
import { useFilterize, createFilterConfig, FilterConfig, CoreOutputValueTypes } from '@matthew.ngo/react-filterize';

const MyComponent = () => {
  // Define filter configurations using createFilterConfig
  const searchConfig = createFilterConfig({
    key: 'search',
    outputType: 'string' as const,
    defaultValue: '',
    debounce: 300,
    options: {
      placeholder: 'Search...'
    }
  });

  const dateRangeConfig = createFilterConfig({
    key: 'dateRange',
    outputType: 'range<date>' as const,
    defaultValue: [new Date(), new Date()],
    options: {
      format: 'yyyy-MM-dd'
    }
  });

  const filtersConfig: FilterConfig<CoreOutputValueTypes>[] = [
    searchConfig,
    dateRangeConfig
  ];

  const { filters, updateFilter, loading, data } = useFilterize({
    filtersConfig,
    fetchData: async (filters) => {
      const response = await fetch('/api/data?' + new URLSearchParams(filters));
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    }
  });

  return (
    <div>
      <input
        type="text"
        value={filters.search || ''}
        onChange={(e) => updateFilter('search', e.target.value)}
        placeholder={searchConfig.options?.placeholder}
      />
      {/* Loading and data display */}
      {loading && <div>Loading...</div>}
      {data && (
        <ul>
          {data.map(item => (
            <li key={item.id}>{item.name}</li>
          ))}
        </ul>
      )}
      {/* Rest of your UI */}
    </div>
  );
};
```

## Best Practices

### 1. Filter Configuration

- **Organize filters by groups** for better maintainability:

```tsx
// You can still define filter groups
const filterGroups = [
  {
    key: 'basic',
    label: 'Basic Filters',
    filters: ['search', 'status'],
    collapsed: false
  },
  {
    key: 'advanced',
    label: 'Advanced Filters',
    filters: ['dateRange', 'tags'],
    collapsed: true
  }
];
```

- **Use `createFilterConfig` to define each filter with its specific `outputType`** for type safety. This ensures that you get autocompletion and type checking for the filter options based on the chosen `outputType`, helping you avoid configuration errors:

```tsx
// Good
const statusConfig = createFilterConfig({
  key: 'status',
  outputType: 'boolean' as const,
  defaultValue: false,
  label: 'Status'
});

const dateRangeConfig = createFilterConfig({
  key: 'dateRange',
  outputType: 'range<date>' as const,
  defaultValue: [new Date(), new Date()],
  label: 'Date Range'
});
```
- **Ensure each filter has a unique `key`:** The `key` is crucial as it identifies each filter uniquely within your application. Duplicate keys can lead to unexpected behavior, such as filters not updating correctly or applying incorrect values. Always ensure each `key` is a unique string across all your filter configurations.
- **Provide `options` based on the `outputType`**:

```tsx
const searchConfig = createFilterConfig({
  key: 'search',
  outputType: 'string' as const,
  defaultValue: '',
  label: 'Search Products',
  debounce: 300,
  options: {
    maxLength: 50,
    placeholder: 'Search products...',
  },
  transform: (value: string) => value.toLowerCase().trim(),
});
```

### 2. Performance Optimization

- **Use appropriate debounce values** for text inputs, especially with `outputType: 'string'` and the use of `transform`:

```tsx
const searchConfig = createFilterConfig({
  key: 'search',
  outputType: 'string' as const,
  debounce: 300, // Good for search
  // Add validation if needed, for example:
  validation: (value: string) => value.length >= 2,
  options: {
    placeholder: 'Search...',
  }
});
```

- **Implement proper caching strategies**: Use `cacheTimeout` to define how long the fetched data should be cached (in milliseconds). Use `persistFilters` to persist filter values in local storage, so they are retained across sessions.

```tsx
const { filters, updateFilter } = useFilterize({
  filtersConfig, // your filter config array here, created using createFilterConfig
  fetchData: async (filters) => {
    // Your fetch logic here
  },
  options: {
    cacheTimeout: 5 * 60 * 1000, // Example: 5 minutes
    persistFilters: true, // Example: Persist filters in local storage
    retry: { // Example: Retry configuration
      attempts: 3,
      delay: 1000,
      backoff: true,
    }
  }
});
```

### 3. Error Handling

- **Use the `validation` option within `createFilterConfig` to implement input validation:**

```tsx
const priceRangeConfig = createFilterConfig({
  key: 'priceRange',
  outputType: 'range<number>' as const,
  defaultValue: [0, 2000],
  label: 'Price Range',
  options: {
    min: 0,
    max: 2000,
    step: 100
  },
  validation: ([min, max]: [number, number]) => {
    if (min < 0) return false; // Example validation
    if (max > 10000) return false; // Example validation
    return min <= max;
  }
});
```

- Use `error` returned from `useFilterize` to handle any errors returned by `fetchData`. Additionally, use `try...catch` blocks within your `fetchData` function to handle potential errors during the API call:

```tsx
const { error, loading, data } = useFilterize({
  filtersConfig,
  fetchData: async (filters) => {
    try {
      const response = await fetch('/api/data?' + new URLSearchParams(filters));
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.status}`);
      }
      return response.json();
    } catch (error) {
      console.error("Fetch error:", error);
      // Optionally rethrow the error or handle it appropriately
      throw error;
    }
  }
});

if (error) {
  return <div>Error: {error.message}</div>;
}
```

### 4. URL Synchronization

- **Enable URL sync for shareable filters**:
```tsx
const { filters } = useFilterize({
  filtersConfig, // your filter config array here, created using createFilterConfig
  fetchData: async (filters) => {
    // Your fetch logic here
  },
  options: {
    syncWithUrl: true // Enable URL synchronization
  }
});
```

### 5. Retry

- Configure the built-in retry mechanism in the `options` property of the `useFilterize` hook for resilience.
```tsx
const { data } = useFilterize({
  // ... other props
  options: {
    retry: {
      attempts: 3, // Number of retry attempts
      delay: 1000, // Delay between retries in milliseconds
      backoff: true, // Enable exponential backoff
    },
  },
});
```

### 6. Transformations

- Use `transform` in the filter configuration (within `createFilterConfig`) to transform input values before they are used.
- Leverage the `transform` function in the `useFilterize` options for more complex input and output transformations.

```tsx
// Example using transform in a filter configuration
const searchConfig = createFilterConfig({
  key: 'search',
  outputType: 'string' as const,
  transform: (value: string) => value.toLowerCase().trim(), // Example transform
  // ... other properties
});

// Example using transform in useFilterize options for input and output
const { data } = useFilterize({
  // ... other props
  options: {
    transform: {
      input: (filters) => ({ ...filters, _t: Date.now() }), // Add a timestamp to the input
      output: (data) => ({
          items: data,
          total: data.length,
          timestamp: Date.now(),
      }),
    },
  },
});
```

## Examples

### 1. Advanced Search with Multiple Filter Types

```tsx
import React, { useState } from 'react';
import {
  FilterConfig,
  useFilterize,
  CoreOutputValueTypes,
  createFilterConfig,
} from '@matthew.ngo/react-filterize';

const mockApi = async (filters: Record<string, any>) => {
  // Mock API call with delay and potential error
  const delay = Math.random() * 1000 + 500;
  await new Promise(resolve => setTimeout(resolve, delay));

  if (Math.random() < 0.5) {
    throw new Error('API request failed');
  }
  // Simulate returning a filtered dataset
  const items = [
    {
      id: 1,
      name: 'Laptop Pro',
      status: true,
      price: 1200,
      color: '#000000',
      rating: 4.5,
      tags: ['electronics', 'work'],
      lastUpdated: new Date('2024-01-15'),
    },
    {
      id: 2,
      name: 'Smart Phone X',
      status: true,
      price: 800,
      color: '#FF0000',
      rating: 4.0,
      tags: ['electronics', 'mobile'],
      lastUpdated: new Date('2024-01-14'),
    },
    {
      id: 3,
      name: 'Tablet Air',
      status: false,
      price: 500,
      color: '#0000FF',
      rating: 3.5,
      tags: ['electronics', 'mobile'],
      lastUpdated: new Date('2024-01-13'),
    },
    {
      id: 4,
      name: 'Smart Watch',
      status: true,
      price: 300,
      color: '#00FF00',
      rating: 4.8,
      tags: ['electronics', 'wearable'],
      lastUpdated: new Date('2024-01-12'),
    },
    {
      id: 5,
      name: 'Wireless Headphones',
      status: false,
      price: 200,
      color: '#FFFFFF',
      rating: 4.2,
      tags: ['electronics', 'audio'],
      lastUpdated: new Date('2024-01-11'),
    },
  ];

  // Apply filters based on filter values received
  return items.filter(item => {
    const searchMatch =
      !filters.search ||
      item.name.toLowerCase().includes(filters.search.toLowerCase());
    const statusMatch =
      filters.status === undefined || item.status === filters.status;
    const priceMatch =
      (!filters.priceRange?.[0] || item.price >= filters.priceRange[0]) &&
      (!filters.priceRange?.[1] || item.price <= filters.priceRange[1]);
    const ratingMatch = !filters.rating || item.rating >= filters.rating;
    const tagMatch =
      !filters.tags?.length ||
      filters.tags.some((tag: string) => item.tags.includes(tag));
    const dateMatch =
      (!filters.dateRange?.[0] ||
        new Date(item.lastUpdated) >= filters.dateRange[0]) &&
      (!filters.dateRange?.[1] ||
        new Date(item.lastUpdated) <= filters.dateRange[1]);

    return (
      searchMatch &&
      statusMatch &&
      priceMatch &&
      ratingMatch &&
      tagMatch &&
      dateMatch
    );
  });
};

const AdvancedSearch = () => {
  const [apiCalls, setApiCalls] = useState(0);

  // Define filter configurations using createFilterConfig
  const searchConfig = createFilterConfig({
    key: 'search',
    outputType: 'string' as const,
    defaultValue: '',
    label: 'Search Products',
    debounce: 300,
    options: {
      maxLength: 50,
      placeholder: 'Search products...',
    },
    transform: (value: string) => value.toLowerCase().trim(),
  });

  const statusConfig = createFilterConfig({
    key: 'status',
    outputType: 'boolean' as const,
    defaultValue: false,
    label: 'Product Status'
  });

  const priceRange = createFilterConfig({
    key: 'priceRange',
    outputType: 'range<number>' as const,
    defaultValue: [0, 2000],
    label: 'Price Range',
    options: {
      min: 0,
      max: 2000,
      step: 100,
      marks: [
        { value: 0, label: '$0' },
        { value: 1000, label: '$1000' },
        { value: 2000, label: '$2000' },
      ],
    },
  });

  const ratingConfig = createFilterConfig({
    key: 'rating',
    outputType: 'number' as const,
    defaultValue: 0,
    label: 'Minimum Rating',
    options: {
      min: 0,
      max: 5,
    },
  });

  const tagsConfig = createFilterConfig({
    key: 'tags',
    outputType: 'string[]' as const,
    defaultValue: [],
    label: 'Product Tags',
    options: {
      maxTags: 5,
      suggestions: ['electronics', 'mobile', 'audio', 'wearable', 'work'],
    },
  });

  const dateRangeConfig = createFilterConfig({
    key: 'dateRange',
    outputType: 'range<date>' as const,
    defaultValue: [new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date()],
    label: 'Update Date Range',
    options: {
      minDate: new Date(2023, 0, 1),
      maxDate: new Date(),
      format: 'yyyy-MM-dd',
    },
  });

  const filtersConfig: FilterConfig<CoreOutputValueTypes>[] = [
    searchConfig,
    statusConfig,
    priceRange,
    ratingConfig,
    tagsConfig,
    dateRangeConfig,
  ];

  const {
    filters,
    updateFilter,
    loading,
    error,
    data,
    history: { undo, redo, canUndo, canRedo },
    fetchData: refetch
  } = useFilterize({
    filtersConfig,
    fetchData: async (filters) => {
      setApiCalls(prev => prev + 1);
      return mockApi(filters);
    },
    options: {
      syncWithUrl: true,
      enableAnalytics: true,
      autoFetch: true,
      retry: {
        attempts: 3,
        delay: 1000,
        backoff: true,
      },
      transform: {
        input: (filters) => ({ ...filters, _t: Date.now() }),
        output: (data) => ({
          items: data,
          total: data.length,
          timestamp: Date.now(),
        }),
      },
    },
  });

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {/* History Controls */}
      <div className="mb-4 flex items-center space-x-4">
        <button
          onClick={undo}
          disabled={!canUndo}
          className={`px-3 py-1 rounded ${
            canUndo ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
        >
          Undo
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          className={`px-3 py-1 rounded ${
            canRedo ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
        >
          Redo
        </button>
        <button
          onClick={refetch}
          className="px-3 py-1 rounded bg-green-500 text-white"
        >
          Refresh
        </button>
        <span className="text-sm text-gray-500">API Calls: {apiCalls}</span>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium mb-1">
            {searchConfig.label}
          </label>
          <input
            type="text"
            value={filters.search || '' as any}
            onChange={e => updateFilter('search', e.target.value)}
            placeholder={searchConfig.options?.placeholder}
            maxLength={searchConfig.options?.maxLength}
            className="w-full p-2 border rounded"
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium mb-1">
            {statusConfig.label}
          </label>
          <select
            value={filters.status === undefined ? '' : String(filters.status)}
            onChange={e =>
              updateFilter(
                'status',
                e.target.value === '' ? undefined : e.target.value === 'true'
              )
            }
            className="w-full p-2 border rounded"
          >
            <option value="">All</option>
            <option value="true">Available</option>
            <option value="false">Unavailable</option>
          </select>
        </div>

        {/* Price Range */}
        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1">
            {priceRange.label}
          </label>
          <div className="flex space-x-4">
            <input
              type="number"
              value={filters.priceRange?.[0] || ''}
              onChange={e =>
                updateFilter('priceRange', [
                  Number(e.target.value),
                  filters.priceRange?.[1] || 2000,
                ])
              }
              min={priceRange.options?.min}
              max={priceRange.options?.max}
              step={priceRange.options?.step}
              className="w-1/2 p-2 border rounded"
            />
            <input
              type="number"
              value={filters.priceRange?.[1] || ''}
              onChange={e =>
                updateFilter('priceRange', [
                  filters.priceRange?.[0] || 0,
                  Number(e.target.value),
                ])
              }
              min={priceRange.options?.min}
              max={priceRange.options?.max}
              step={priceRange.options?.step}
              className="w-1/2 p-2 border rounded"
            />
          </div>
        </div>

        {/* Rating */}
        <div>
          <label className="block text-sm font-medium mb-1">
            {ratingConfig.label}
          </label>
          <select
            value={filters.rating || '0' as any}
            onChange={e => updateFilter('rating', Number(e.target.value))}
            className="w-full p-2 border rounded"
          >
            <option value="0">Any Rating</option>
            <option value="3">3+ Stars</option>
            <option value="4">4+ Stars</option>
            <option value="4.5">4.5+ Stars</option>
          </select>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium mb-1">
            {tagsConfig.label}
          </label>
          <select
            multiple
            value={filters.tags || [] as any}
            onChange={e =>
              updateFilter(
                'tags',
                Array.from(e.target.selectedOptions, option => option.value)
              )
            }
            className="w-full p-2 border rounded"
            size={4}
          >
            {Array.isArray((tagsConfig.options as any)?.suggestions) &&
              (tagsConfig.options as any)?.suggestions.map(tag => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Status Messages */}
      {loading && <div className="text-gray-500">Loading...</div>}
      {error && <div className="text-red-500 mb-4">Error: {error.message}</div>}

      {/* Results */}
      <div className="space-y-2">
        {data?.items.length === 0 && (
          <div className="text-gray-500">No results found</div>
        )}
        {data?.items.map((item: any) => (
          <div
            key={item.id}
            className="p-3 border rounded flex justify-between items-center"
          >
            <div>
              <div className="font-medium">{item.name}</div>
              <div className="text-sm text-gray-500">
                Status: {item.status ? 'Available' : 'Unavailable'}
                <span className="mx-2">•</span>
                Rating: {item.rating}
                <span className="mx-2">•</span>
                Tags: {item.tags.join(', ')}
              </div>
            </div>
            <div className="font-medium">${item.price}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 text-sm text-gray-500">
        Total results: {data?.total || 0}
        <br />
        Last updated:{' '}
        {data?.timestamp ? new Date(data.timestamp).toLocaleString() : 'Never'}
      </div>
    </div>
  );
};

export default AdvancedSearch;
```

### 2. Analytics Integration

```tsx
const SearchWithAnalytics = () => {
  const {
    filters,
    updateFilter,
    analytics
  } = useFilterize({
    filtersConfig: [], // your filter config here
    fetchData: async (filters) => {
      // Your fetch logic here
    },
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

// Example placeholder for AnalyticsDashboard
const AnalyticsDashboard = ({ analytics }: any) => {
  const report = analytics?.getAnalyticsReport();

  return (
    <div>
      <h2>Analytics Dashboard</h2>
      {report ? (
        <div>
          <p>Total Filter Usage: {report.filterUsage}</p>
          {/* Display other analytics data as needed */}
        </div>
      ) : (
        <p>No data available</p>
      )}
    </div>
  );
};
```

## API Reference

### useFilterize

Main hook for managing filters.

```tsx
interface UseFilterizeProps<T extends CoreOutputValueTypes> {
  filtersConfig: FilterConfig<T>[];
  fetchData: (filters: Record<string, any>) => Promise<any>;
  options?: {
    syncWithUrl?: boolean; // If true, synchronizes the filters with the URL query parameters.
    enableAnalytics?: boolean; // If true, enables analytics tracking for filter usage.
    cacheTimeout?: number; // The time (in milliseconds) for which the fetched data is cached.
    autoFetch?: boolean; // If true, automatically fetches data when filters change.
    storage?: StorageConfig; // Configuration for storing filter data (e.g., localStorage, sessionStorage).
    retry?: RetryConfig; // Configuration for retrying failed requests.
    transform?: TransformConfig; // Configuration for transforming input and output data.
  };
  presets?: FilterPresets;
  groups?: FilterGroup[]; // Currently unused, reserved for future implementation.
}

interface FilterConfig<T extends CoreOutputValueTypes>
  extends BaseFilterConfig {
  outputType: T;
  defaultValue: OutputValueType[T];
  options?: FilterOptionsType<T>;
  dependencies?: Record<string, (value: OutputValueType[T]) => any>; // Specifies dependencies between filters. When the value of a dependency changes, the dependent filter's value is updated. The function receives the new value of the dependency and should return a new value for the dependent filter.
  validation?: (value: OutputValueType[T]) => boolean | Promise<boolean>;
  transform?: (value: OutputValueType[T]) => any; // Transforms the filter value before it is used in filtering data. This is especially useful for 'string' inputs or when needing to manipulate input right before sending to the API.
}

// transform configuration in options
interface TransformConfig {
  input?: (data: any) => any;
  output?: (data: any) => any;
}

// retry configuration in options
interface RetryConfig {
  attempts: number;
  delay: number;
  backoff?: boolean;
}

interface FilterPresets {
  dateRanges: {
    today: () => [Date, Date];
    lastWeek: () => [Date, Date];
    lastMonth: () => [Date, Date];
    custom: (start: Date, end: Date) => [Date, Date];
  };
  sorts: {
    nameAsc: SortConfig;
    nameDesc: SortConfig;
    dateAsc: SortConfig;
    dateDesc: SortConfig;
  };
}
```

### createFilterConfig

Helper function to create type-safe filter configs.

```tsx
export function createFilterConfig<T extends CoreOutputValueTypes>(
  config: TypedFilterConfig<T>
): TypedFilterConfig<T> {
  return config;
}

export type TypedFilterConfig<T extends CoreOutputValueTypes> = {
  key: string; // Unique identifier for the filter.
  label?: string;
  description?: string;
  required?: boolean;
  hidden?: boolean;
  disabled?: boolean;
  debounce?: number;
  outputType: T;
  defaultValue: OutputValueType[T];
  options?: InferFilterOptions<T>;
  dependencies?: Record<string, (value: OutputValueType[T]) => any>;
  validation?: (value: OutputValueType[T]) => boolean | Promise<boolean>;
  transform?: (value: OutputValueType[T]) => any;
};

// Core output value types supported by the library
export type CoreOutputValueTypes = keyof OutputValueType;

export interface OutputValueType {
  string: string;
  number: number;
  boolean: boolean;
  date: Date;
  'string[]': ArrayValue<string>;
  'number[]': ArrayValue<number>;
  'range<number>': RangeValue<number>;
  'range<date>': RangeValue<Date>;
}

type SingleValue = string | number | boolean;
type RangeValue<T> = [T, T];
type ArrayValue<T> = T[];
```

### Filter Options

The `options` property in `FilterConfig` allows you to customize the behavior and appearance of each filter. The available options depend on the `outputType` of the filter.

#### Common Options

| Option        | Description                                              |
| ------------- | -------------------------------------------------------- |
| `label`       | The label displayed for the filter.                     |
| `description` | A description of the filter.                          |
| `required`    | Whether the filter is required.                        |
| `hidden`      | Whether the filter is hidden.                          |
| `disabled`    | Whether the filter is disabled.                         |
| `debounce`   | Debounce time in milliseconds for updating the filter. |
| `transform` | Function to transform the filter value before it is used in filtering the data, especially useful for `string` inputs or when needing to manipulate input right before sending to API.       |
| `validation` | Function to validate the filter value.                 |

#### Specific Options

| `outputType`       | Options                                                                 |
| ----------------- | ----------------------------------------------------------------------- |
| `string`          | `TextOptions` &#124; `QueryOptions` (e.g., `maxLength`, `placeholder`) |
| `number`          | `NumberOptions` &#124; `SliderOptions` (e.g., `min`, `max`, `step`)     |
| `boolean`         | (No specific options)                                                    |
| `date`            | `DateRangeOptions` (e.g. `minDate`, `maxDate`, `format`)                  |
| `string[]`        | `SelectOptions` &#124; `MultiSelectOptions<string>` &#124; `TagsOptions`   |
| `number[]`        | `SelectOptions` &#124; `MultiSelectOptions<number>` &#124; `SliderOptions`   |
| `range<number>`   | `NumberOptions` &#124; `SliderOptions`                                   |
| `range<date>`     | `DateRangeOptions`                                                     |

#### Option Interfaces

```typescript
export interface TextOptions {
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  placeholder?: string;
}

export interface NumberOptions {
  min?: number;
  max?: number;
  step?: number;
}

export interface SelectOptions<T extends SingleValue = SingleValue> {
  options: Array<{ value: T; label: string }>;
  allowEmpty?: boolean;
}

export interface MultiSelectOptions<T extends SingleValue = SingleValue> {
  options: Array<{ value: T; label: string }>;
  maxSelect?: number;
  minSelect?: number;
}

export interface DateRangeOptions {
  minDate?: Date;
  maxDate?: Date;
  format?: string;
}

export interface TimeOptions {
  format?: '12h' | '24h';
  step?: number;
}

export interface SliderOptions {
  min: number;
  max: number;
  step?: number;
  marks?: Array<{ value: number; label: string }>;
}

export interface RatingOptions {
  max?: number;
  allowHalf?: boolean;
}

export interface TagsOptions {
  maxTags?: number;
  suggestions?: string[];
}

export interface ColorOptions {
  format?: 'hex' | 'rgb' | 'hsl';
  presets?: string[];
}

export interface QueryOptions {
  maxLength?: number;
  placeholder?: string;
}
```

## Troubleshooting

-   **Filters are not updating:**
    *   Make sure the `key` for each filter is unique.
    *   Check if `debounce` is set appropriately, especially for text inputs.
    *   Verify that your `fetchData` function is correctly handling the filter values and returning the expected data.
-   **Error: "Network response was not ok"**:
    * This usually indicates an issue with the API request. Check your API endpoint and ensure it's returning the correct response. Use the browser's developer tools (Network tab) to inspect the request and response. Also, implement proper error handling in your `fetchData` function using `try...catch` and check for `response.ok`.

## Contributing

Contributions are welcome! If you'd like to contribute to this project, please follow these steps:

1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Make your changes and commit them with clear commit messages.
4. Write tests for your changes.
5. Submit a pull request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## FAQs

-   **Q: Can I use this library with a different data fetching library (e.g., Axios, SWR)?**

    -   A: Yes, you can use any data fetching library you prefer. Just replace the `fetch` calls in the examples with your library of choice. `useFilterize`'s `fetchData` prop only requires a function that accepts a `filters` object and returns a Promise that resolves to the fetched data.
-   **Q: How can I reset all filters to their default values?**

    -   A: You can achieve this by using the `resetFilters` function returned from `useFilterize`.
