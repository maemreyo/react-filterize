[![Version](https://img.shields.io/npm/v/@matthew.ngo/react-filterize.svg)](https://www.npmjs.com/package/@matthew.ngo/react-filterize)
[![Downloads/week](https://img.shields.io/npm/dw/@matthew.ngo/react-filterize.svg)](https://www.npmjs.com/package/@matthew.ngo/react-filterize)
[![License](https://img.shields.io/npm/l/@matthew.ngo/react-filterize.svg)](https://github.com/maemreyo/react-filterize/blob/main/LICENSE)
[![codecov](https://codecov.io/gh/maemreyo/react-filterize/graph/badge.svg?token=YOUR_CODECOV_TOKEN)](https://codecov.io/gh/maemreyo/react-filterize)

# @matthew.ngo/react-filterize Documentation

`@matthew.ngo/react-filterize` is a React library that provides hooks and utility functions to easily manage and synchronize filter states across URLs, local storage, and API calls.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Best Practices](#best-practices)
- [Examples](#examples)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)
- [FAQs](#faqs)

## Installation

```bash
# Using npm
npm install @matthew.ngo/react-filterize

# Using yarn
yarn add @matthew.ngo/react-filterize

# Using pnpm
pnpm add @matthew.ngo/react-filterize
```

## Quick Start

```tsx
import { useFilterize, addFilter, ValueTypes } from '@matthew.ngo/react-filterize';

// 1. Define your filters
const config = [
  addFilter({
    key: 'search',
    type: ValueTypes.STRING
  }),
  addFilter({
    key: 'category',
    type: ValueTypes.STRING
  }),
  addFilter({
    key: 'minPrice',
    type: ValueTypes.NUMBER
  })
];

// 2. Create your fetch function
const fetchData = async (filters) => {
  const response = await api.get('/products', { params: filters });
  return response.data;
};

// 3. Use the hook
function ProductList() {
  const { 
    filters, 
    updateFilter, 
    data, 
    loading 
  } = useFilterize({
    config,
    fetch: fetchData
  });

  return (
    <div>
      <input 
        value={filters.search || ''} 
        onChange={(e) => updateFilter('search', e.target.value)}
      />
      {/* Rest of your UI */}
    </div>
  );
}
```

## Best Practices

### Filter Configuration

1. **Use Meaningful Keys**: Choose filter keys that reflect their purpose
```tsx
// Good
addFilter({ key: 'categoryId', type: ValueTypes.NUMBER })

// Avoid
addFilter({ key: 'f1', type: ValueTypes.NUMBER })
```

2. **Provide Default Values When Appropriate**:
```tsx
addFilter({
  key: 'status',
  type: ValueTypes.STRING,
  defaultValue: 'active'
})
```

3. **Add Labels and Descriptions**:
```tsx
addFilter({
  key: 'dateRange',
  type: ValueTypes.DATE_ARRAY,
  label: 'Date Range',
  description: 'Select start and end dates'
})
```

### Performance Optimization

1. **Use Debouncing for Text Filters**:
```tsx
const options = {
  fetch: {
    debounceTime: 300 // 300ms delay
  }
}
```

2. **Implement Caching**:
```tsx
const options = {
  cacheTimeout: 5000, // Cache results for 5 seconds
  storage: {
    type: 'local',
    key: 'product-filters'
  }
}
```

3. **Selective URL Synchronization**:
```tsx
const options = {
  url: {
    include: ['search', 'category'], // Only sync these filters
    exclude: ['temporaryFilter'] // Never sync these
  }
}
```

## Examples

### Basic Filtering

```tsx
function BasicExample() {
  const config = [
    addFilter({
      key: 'search',
      type: ValueTypes.STRING
    })
  ];

  const { filters, updateFilter } = useFilterize({
    config,
    fetch: async (filters) => {
      // Your fetch logic
    }
  });

  return (
    <input
      value={filters.search || ''}
      onChange={(e) => updateFilter('search', e.target.value)}
    />
  );
}
```

### Advanced Configuration

```tsx
function AdvancedExample() {
  const config = [
    addFilter({
      key: 'search',
      type: ValueTypes.STRING,
      transform: (value) => value.toLowerCase()
    }),
    addFilter({
      key: 'price',
      type: ValueTypes.NUMBER_ARRAY,
      dependencies: {
        currency: async (value) => {
          // Convert price based on currency
          return value;
        }
      }
    })
  ];

  const options = {
    url: {
      key: 'f',
      encode: true
    },
    storage: {
      type: 'local',
      version: '1.0.0',
      migrations: [
        {
          fromVersion: '0.9.0',
          transform: (data) => {
            // Migration logic
            return data;
          }
        }
      ]
    },
    fetch: {
      debounceTime: 300,
      requiredFilters: ['category'],
      beforeFetch: (filters) => {
        // Transform filters before fetch
        return filters;
      }
    }
  };

  const { filters, updateFilter } = useFilterize({
    config,
    fetch: async (filters) => {
      // Your fetch logic
    },
    options
  });

  return (
    // Your UI
  );
}
```

## API Reference

# React Filterize Configuration Reference

## Default Options

All default values are defined in the core configuration. Here's a comprehensive breakdown of each option and its default value:

### Base Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `cacheTimeout` | `number` | `300000` (5 minutes) | How long to cache results in milliseconds |
| `autoFetch` | `boolean` | `true` | Whether to automatically fetch when filters change |

### URL Options (`url`)

Controls how filters are synchronized with the URL.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `key` | `string` | `'filters'` | Prefix for URL parameters |
| `encode` | `boolean` | `true` | Whether to encode/decode URL parameters |
| `mergeParams` | `boolean` | `true` | Whether to merge with existing URL params (true) or override them (false) |
| `namespace` | `string` | `'ogn-filters'` | Namespace for multiple filter instances on same page |
| `transformers` | `Record<string, (value: any) => string>` | `{}` | Custom transform functions for specific filter keys |

Example usage:
```typescript
const options = {
  url: {
    key: 'myFilters',
    namespace: 'products',
    transformers: {
      date: (value: Date) => value.toISOString()
    }
  }
}
```

### Storage Options (`storage`)

Controls how filters are persisted in storage.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `type` | `'local' \| 'session' \| 'memory' \| 'none'` | `'none'` | Storage type to use |
| `key` | `string` | - | Storage key (required if type !== 'none') |
| `version` | `string` | - | Data schema version |
| `migrations` | `MigrationStrategy[]` | - | Migration strategies for version upgrades |
| `include` | `string[]` | - | Fields to include in storage |
| `exclude` | `string[]` | - | Fields to exclude from storage |
| `compress` | `boolean` | `false` | Whether to compress stored data |
| `serialize` | `(data: any) => string` | - | Custom serialization function |
| `deserialize` | `(data: string) => any` | - | Custom deserialization function |

Example usage:
```typescript
const options = {
  storage: {
    type: 'local',
    key: 'product-filters',
    version: '1.0.0',
    migrations: [{
      fromVersion: '0.9.0',
      transform: (data) => {
        // Migration logic
        return data;
      }
    }]
  }
}
```

### Retry Options (`retry`)

Controls retry behavior for failed requests.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `attempts` | `number` | `3` | Number of retry attempts |
| `delay` | `number` | `1000` | Delay between retries in milliseconds |
| `backoff` | `boolean` | `true` | Whether to use exponential backoff |

Example usage:
```typescript
const options = {
  retry: {
    attempts: 5,
    delay: 2000,
    backoff: true
  }
}
```

### Transform Options (`transform`)

Controls data transformation before and after fetching.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `input` | `(data: any) => any` | `(data) => data` | Transform filters before fetching |
| `output` | `(data: any) => any` | `(data) => data` | Transform response data after fetching |

Example usage:
```typescript
const options = {
  transform: {
    input: (filters) => ({
      ...filters,
      timestamp: Date.now()
    }),
    output: (data) => data.map(item => ({
      ...item,
      price: Number(item.price)
    }))
  }
}
```

### Fetch Options (`fetch`)

Controls the fetching behavior.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `dependencies` | `any[]` | `[]` | Additional dependencies that trigger refetch |
| `debounceTime` | `number` | `300` | Debounce time in milliseconds |
| `fetchOnEmpty` | `boolean` | `true` | Whether to fetch when filters are empty |
| `requiredFilters` | `string[]` | `[]` | Filters that must have values before fetching |
| `shouldFetch` | `(filters: Record<string, any>) => boolean \| Promise<boolean>` | `() => true` | Condition to determine if fetch should occur |
| `beforeFetch` | `(filters: Record<string, any>) => Record<string, any> \| Promise<Record<string, any>>` | `filters => filters` | Transform filters right before fetching |
| `onMissingRequired` | `(missingFilters: string[]) => void` | `() => {}` | Called when required filters are missing |
| `onFetchPrevented` | `(filters: Record<string, any>) => void` | `() => {}` | Called when shouldFetch returns false |

Example usage:
```typescript
const options = {
  fetch: {
    debounceTime: 500,
    requiredFilters: ['category', 'search'],
    shouldFetch: (filters) => Object.keys(filters).length > 0,
    beforeFetch: async (filters) => {
      const enrichedFilters = await enrichFilters(filters);
      return enrichedFilters;
    },
    onMissingRequired: (missing) => {
      console.warn('Missing required filters:', missing);
    }
  }
}
```

## Complete Configuration Example

Here's an example showing all options with their default values:

```typescript
const options = {
  // Base options
  cacheTimeout: 5 * 60 * 1000,  // 5 minutes
  autoFetch: true,

  // URL synchronization
  url: {
    key: 'filters',
    encode: true,
    mergeParams: true,
    namespace: 'ogn-filters',
    transformers: {}
  },

  // Storage configuration
  storage: {
    type: 'none' as const,
    key: undefined,
    version: undefined,
    migrations: undefined,
    include: undefined,
    exclude: undefined,
    compress: false,
    serialize: undefined,
    deserialize: undefined
  },

  // Retry configuration
  retry: {
    attempts: 3,
    delay: 1000,
    backoff: true
  },

  // Data transformation
  transform: {
    input: (data: any) => data,
    output: (data: any) => data
  },

  // Fetch behavior
  fetch: {
    dependencies: [],
    debounceTime: 300,
    fetchOnEmpty: true,
    requiredFilters: [],
    shouldFetch: () => true,
    beforeFetch: filters => filters,
    onMissingRequired: () => {},
    onFetchPrevented: () => {}
  }
};
```

## Type Definitions

For TypeScript users, here are the complete type definitions for the options:

```typescript
interface UseFilterizeOptions<TConfig extends FilterConfig[]> {
  url?: UrlConfig | boolean;
  storage?: StorageConfig;
  cacheTimeout?: number;
  autoFetch?: boolean;
  retry?: RetryConfig;
  transform?: TransformConfig;
  fetch?: FetchConfig;
  defaults?: DefaultValuesConfig;
}

interface UrlConfig {
  key?: string;
  encode?: boolean;
  mergeParams?: boolean;
  namespace?: string;
  transformers?: Record<string, (value: any) => string>;
  serialize?: (filters: Record<string, any>) => string;
  deserialize?: (query: string) => Record<string, any>;
}

interface StorageConfig {
  type?: 'local' | 'session' | 'memory' | 'none';
  key?: string;
  version?: string;
  migrations?: MigrationStrategy[];
  include?: string[];
  exclude?: string[];
  compress?: boolean;
  serialize?: (data: any) => string;
  deserialize?: (data: string) => any;
  onMigrationComplete?: (oldVersion: string, newVersion: string, data: any) => void;
}

interface RetryConfig {
  attempts: number;
  delay: number;
  backoff?: boolean;
}

interface TransformConfig {
  input?: (data: any) => any;
  output?: (data: any) => any;
}

interface FetchConfig {
  dependencies?: any[];
  debounceTime?: number;
  fetchOnEmpty?: boolean;
  requiredFilters?: string[];
  shouldFetch?: (filters: Record<string, any>) => boolean | Promise<boolean>;
  beforeFetch?: (filters: Record<string, any>) => Record<string, any> | Promise<Record<string, any>>;
  onMissingRequired?: (missingFilters: string[]) => void;
  onFetchPrevented?: (filters: Record<string, any>) => void;
}
```

## Troubleshooting

### Common Issues

1. **Filters Not Updating**
- Check if `updateFilter` is called with correct types
- Verify filter configuration matches expected values
- Check browser console for errors

2. **URL Sync Issues**
- Ensure URL configuration is correct
- Check if filters are included/excluded properly
- Verify URL encoding settings

3. **Storage Problems**
- Clear local storage and retry
- Check storage version and migrations
- Verify storage configuration

## FAQs

### General Questions

**Q: Can I use this with REST and GraphQL APIs?**  
A: Yes, the fetch function is API-agnostic. You can implement any data fetching logic.

**Q: Does it support SSR?**  
A: Yes, the library is SSR-friendly when configured properly.

**Q: How does caching work?**  
A: Results are cached based on filter values for the duration specified in `cacheTimeout`.

### Performance

**Q: How can I optimize performance with large datasets?**  
A: 
1. Use appropriate debounce times
2. Implement server-side pagination
3. Cache results when possible
4. Only sync necessary filters to URL

**Q: What's the recommended way to handle multiple filter instances?**  
A: Use unique namespaces in URL and storage configurations:

```tsx
const options = {
  url: {
    namespace: 'productFilters'
  },
  storage: {
    key: 'product-filters'
  }
}
```

### Advanced Usage

**Q: How can I implement custom serialization?**  
A: Use the `serialize` and `deserialize` options:

```tsx
const options = {
  url: {
    serialize: (filters) => {
      // Custom serialization logic
      return JSON.stringify(filters);
    },
    deserialize: (query) => {
      // Custom deserialization logic
      return JSON.parse(query);
    }
  }
}
```

**Q: Can I transform data before/after fetch?**  
A: Yes, use the transform options:

```tsx
const options = {
  transform: {
    input: (filters) => {
      // Transform before fetch
      return filters;
    },
    output: (data) => {
      // Transform after fetch
      return data;
    }
  }
}
```