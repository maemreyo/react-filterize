[![Version](https://img.shields.io/npm/v/@matthew.ngo/react-filterize.svg)](https://www.npmjs.com/package/@matthew.ngo/react-filterize)
[![Downloads/week](https://img.shields.io/npm/dw/@matthew.ngo/react-filterize.svg)](https://www.npmjs.com/package/@matthew.ngo/react-filterize)
[![License](https://img.shields.io/npm/l/@matthew.ngo/react-filterize.svg)](https://github.com/maemreyo/react-filterize/blob/main/LICENSE)
[![codecov](https://codecov.io/gh/maemreyo/react-filterize/graph/badge.svg?token=YOUR_CODECOV_TOKEN)](https://codecov.io/gh/maemreyo/react-filterize)

# @matthew.ngo/react-filterize Documentation

`@matthew.ngo/react-filterize` is a React library that provides hooks and utility functions to easily filter data.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Best Practices](#best-practices)
- [Examples](#examples)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)
- [FAQs](#faqs)

## Installation

To install `react-filterize`, you need to use npm or yarn:

```bash
npm install @matthew.ngo/react-filterize
```

or

```bash
yarn add @matthew.ngo/react-filterize
```

## Quick Start

Here's a basic example of how to use `react-filterize`:

```tsx
// example/ProductControl.tsx
import React from 'react';
import styled from 'styled-components';
import Filters from './Filters';
import ProductsGrid from './ProductsGrid';
import { dummyData } from './data';
import { useFilterize, addFilter } from '@matthew.ngo/react-filterize';

const Container = styled.div`
  padding: 20px;
  background: #f5f5f5;
  max-width: 1200px;
  margin: 0 auto;
`;

const Error = styled.div`
  color: #c42b2b;
  padding: 20px;
  text-align: center;
  background: #fee7e7;
  border-radius: 8px;
  margin-bottom: 20px;
  display: ${props => (props.isHidden ? 'none' : 'block')};
`;

const Loading = styled.div`
  text-align: center;
  padding: 20px;
  font-size: 18px;
  display: ${props => (props.isHidden ? 'none' : 'block')};
`;

const ProductControl: React.FC = () => {
  // Define filter configurations
  const config = [
    addFilter({
      key: 'search',
      label: 'Search',
      defaultValue: '',
      transform: (value: string) => value.toLowerCase(),
    }),
    addFilter({
      key: 'status',
      label: 'Status',
      defaultValue: '',
      transform: (value: string) => value === 'true',
    }),
    addFilter({
      key: 'minPrice',
      label: 'Min Price',
      defaultValue: 0,
    }),
    addFilter({
      key: 'maxPrice',
      label: 'Max Price',
      defaultValue: 0,
    }),
    addFilter({
      key: 'rating',
      label: 'Min Rating',
      defaultValue: 0,
    }),
  ];

  // Mock API function
  const fetch = async (filters: any) => {
    const delay = Math.random() * 1000 + 500;
    await new Promise(resolve => setTimeout(resolve, delay));

    return dummyData.filter(item => {
      const searchMatch =
        !filters.search || item.name.toLowerCase().includes(filters.search);
      const statusMatch =
        !filters.status || item.status === (filters.status === 'true');
      const priceMatch =
        (!filters.minPrice || item.price >= filters.minPrice) &&
        (!filters.maxPrice || item.price <= filters.maxPrice);
      const ratingMatch = !filters.rating || item.rating >= filters.rating;

      return searchMatch && statusMatch && priceMatch && ratingMatch;
    });
  };

  // Initialize useFilterize
  const {
    filters,
    updateFilter,
    loading,
    error,
    data: products,
    filterSource,
    refetch,
    reset,
  } = useFilterize({
    config,
    fetch,
    options: {
      url: {
        key: 'search',
      },
      autoFetch: true,
      fetch: {
        fetchOnEmpty: true,
      },
      storage: {
        type: 'local',
        include: ['search'],
      },
    },
  });

  // Handler for filter changes
  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    updateFilter(name, value);
  };

  return (
    <Container>
      <h1>Product Control</h1>

      <Filters filters={filters} setFilters={handleFilterChange} />
      <button onClick={refetch}>Refetch</button>
      <button onClick={reset}>Reset</button>
      <Error isHidden={!error}>
        {error?.message || 'An error occurred while fetching the data.'}
      </Error>
      <Loading isHidden={!loading}>Loading...</Loading>
      <ProductsGrid products={products || []} loading={loading} />
    </Container>
  );
};

export default ProductControl;

```

In this example, we use the `useFilterize` hook to manage the filter state and fetch data.

1. Define the filter configuration with `config`.
2. The `fetch` function simulates calling an API to get data based on the current filters.
3. Use `useFilterize` to initialize the state and update functions.
4. Render the `Filters` component to display the filters.
5. Use the `ProductsGrid` component to display the list of products.
6. Display the loading and error status.

## Best Practices

-   **Use `addFilter` to declare filters:** Use the `addFilter` function to define filters instead of directly declaring objects. This helps to automatically infer data types and ensures type safety.
-   **Separate data fetching logic:** Separate data fetching logic from the main component, making the code easier to read and maintain. Create separate fetch functions or custom hooks to manage data fetching.
-   **Use `transform`:** Use the `transform` function to standardize the filter data before applying it, ensuring consistency. For example, convert search strings to lowercase.
-   **Manage URL and Storage:** Leverage the feature to synchronize with the URL or storage to save the filter state, so users don't have to re-enter the filter every time the page reloads.
-   **Optimize performance:** Use `debounceTime` in the `options` of `useFilterize` to avoid calling the API too frequently when users change filters. Consider using `cacheTimeout` to cache search results for a certain period.
-   **Error handling:** Always handle potential errors that may occur during data fetching. Display error messages to the user and provide options to retry.
- **Use `transform` in the `config` of `addFilter`:** Use it to transform input data (for example, converting strings to lowercase, standardizing date formats).

## Examples

### Filtering products by multiple criteria

```tsx
// ... imports

const config = [
  addFilter({
    key: 'name',
    label: 'Product Name',
    defaultValue: '',
    transform: (value: string) => value.toLowerCase(),
  }),
  addFilter({
    key: 'status',
    label: 'Status',
    type: ValueTypes.BOOLEAN,
    defaultValue: null,
  }),
  addFilter({
    key: 'minPrice',
    label: 'Minimum Price',
    type: ValueTypes.NUMBER,
    defaultValue: 0,
  }),
  addFilter({
    key: 'maxPrice',
    label: 'Maximum Price',
    type: ValueTypes.NUMBER,
    defaultValue: null,
  }),
];

const fetchProducts = async (filters: any) => {
  // Simulate API call
  const delay = Math.random() * 500 + 200;
  await new Promise(resolve => setTimeout(resolve, delay));

  return dummyData.filter(product => {
    const nameMatch = filters.name
      ? product.name.toLowerCase().includes(filters.name)
      : true;
    const statusMatch =
      filters.status !== null ? product.status === filters.status : true;
    const priceMatch =
      product.price >= filters.minPrice &&
      (filters.maxPrice ? product.price <= filters.maxPrice : true);

    return nameMatch && statusMatch && priceMatch;
  });
};

// ... component using useFilterize with config and fetchProducts
```

### Using a Custom Input Component

```tsx
// ... imports

const CustomInput = ({ value, onChange }) => (
  <input
    type="text"
    value={value || ''}
    onChange={e => onChange(e.target.value)}
    placeholder="Custom Input"
  />
);

const config = [
  addFilter({
    key: 'custom',
    label: 'Custom Filter',
    defaultValue: '',
    component: CustomInput,
  }),
];

// ... component using useFilterize with config
```

### Synchronizing with the URL

```tsx
// ... imports

const { filters, updateFilter, loading, error, data } = useFilterize({
  config: [
    // ... filter configurations
  ],
  fetch: /* ... your fetch function */,
  options: {
    url: {
      key: 'f', // Optional: Specify a custom key for URL params
      encode: true, // Optional: Encode the filter values in the URL
      mergeParams: true,
      namespace: 'productFilters',
      serialize: filters => JSON.stringify(filters), // Optional: Custom serialization function for URL
      deserialize: query => JSON.parse(query), // Optional: Custom deserialization function for URL
    },
  },
});
```

### Storing in Local Storage

```tsx
// ... imports

const { filters, updateFilter, loading, error, data } = useFilterize({
  config: [
    // ... filter configurations
  ],
  fetch: /* ... your fetch function */,
  options: {
    storage: {
      type: 'local', // Or 'session' for sessionStorage
      key: 'my-app-filters', // Optional: Specify a custom key for storage
      version: '1.0.0',
      compress: false, // Whether to compress stored data (default: false)
    },
  },
});
```

### Using cache

```tsx
const { filters, updateFilter, loading, error, data } = useFilterize({
  config: [
    // ... filter configurations
  ],
  fetch: /* ... your fetch function */,
  options: {
    cacheTimeout: 5 * 60 * 1000, // Cache results for 5 minutes
  },
});
```

## API Reference

### `useFilterize`

The main hook for managing the filter state and fetching data.

#### Props

| Prop      | Type                                           | Description                                                                                                                                     |
| --------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `config`  | `FilterConfig[]`                               | An array of configurations for each filter. See also `FilterConfig`.                                                                         |
| `fetch`   | `(filters: any) => Promise<any>`              | A function that fetches data based on the current filter values.                                                                               |
| `options` | `{ url?: UrlConfig \| boolean, storage?: StorageConfig, cacheTimeout?: number, autoFetch?: boolean, transform?: TransformConfig, fetch?: FetchConfig }` | Configuration options for `useFilterize`. Includes `url` (synchronization with URL), `storage` (storage), `cacheTimeout` (cache time), `autoFetch` (auto-fetch when filter changes), `transform`, `fetch` |

#### Return Value

| Property          | Type                                     | Description                                                                                       |
| ----------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `filters`         | `Partial<FilterValues<TConfig>>`         | The current values of all filters.                                                                 |
| `updateFilter`    | `(key, value) => void`                  | A function to update the value of a filter.                                                      |
| `loading`         | `boolean`                                | The loading status of the most recent data fetch.                                                 |
| `error`           | `Error \| null`                          | The error of the most recent data fetch (if any).                                                  |
| `data`            | `any`                                    | The data returned from the `fetch` function.                                                       |
| `filterSource` | `FilterSource` | The source of the current filter ('url', 'storage', 'default', 'none'). |
| `refetch`         | `() => Promise<void>`                    | Calls the `fetch` function again with the current filter values.                                    |
| `reset`           | `() => void`                             | Resets all filters to their default values.                                                       |
| `exportFilters`   | `() => { filters: string }`              | Returns the filters as a serialized string                                                            |
| `importFilters`   | `(data: { filters: string; groups?: string[] }) => void` | Sets the filters from a serialized string.                                                            |
| `storage`         | `{ clear: () => Promise<void> }`         | Provides a `clear` function to clear storage.                                                       |
| `history`         | `{ undo: () => void, redo: () => void, canUndo: boolean, canRedo: boolean, current: FilterHistoryState<T>, past: FilterHistoryState<T>[], future: FilterHistoryState<T>[] }`          | The history of filter changes, allowing undo/redo.                                                |
|`fetchState`|`FetchState`| The state of the last fetch. |
| `validateRequiredFilters`         | `any`                                | Function to check if all required filters have been set. |

### `addFilter`

A helper function to create a configuration for a filter.

#### Signature

```typescript
function addFilter<T extends DefaultValue, Type extends ValueTypeKey = InferValueType<NonNullable<T>>>(
  config: Omit<FilterConfigWithoutType<T>, 'type'> & { type?: Type }
): FilterConfig;
```

#### Parameters

| Parameter  | Type                                     | Description                                                      |
| ---------- | ---------------------------------------- | ---------------------------------------------------------------- |
| `config`   | `FilterConfig`                           | The configuration for the filter.                                 |

#### `FilterConfig`

| Property       | Type                      | Description                                                                                                   |
| -------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `key`          | `string`                  | The name of the filter (unique).                                                                              |
| `label`        | `string`                  | The display label of the filter (optional).                                                                   |
| `type`         | `ValueTypeKey`              | The data type of the filter. Defaults to the type inferred from `defaultValue`                             |
| `defaultValue` | `any`                     | The default value of the filter.                                                                              |
| `component`    | `React.ComponentType<any>` | A custom component to render the filter (optional).                                                           |
| `dependencies` |`Record<string, (value: any) => Promise<any> \| any>`| An object containing the dependency processing functions for the filter. |
| `transform`    | `(value: any) => any`      | A function to transform the value of the filter before applying it (e.g., converting a string to lowercase) (optional).      |
| `description`  | `string`                  | Description of the filter (optional).                                                                          |
| `required`     | `boolean`                 | Indicates whether the filter is required (optional).                                                                 |
| `hidden`       | `boolean`                 | Hides the filter from the UI (optional).                                                                           |
| `disabled`     | `boolean`                 | Disables the filter (optional).                                                                              |

#### `ValueTypes`

Enum defining the supported data types:

```typescript
export const ValueTypes = {
  STRING: 'string',
  NUMBER: 'number',
  BOOLEAN: 'boolean',
  DATE: 'date',
  FILE: 'file',
  STRING_ARRAY: 'string[]',
  NUMBER_ARRAY: 'number[]',
  DATE_ARRAY: 'date[]',
  FILE_ARRAY: 'file[]',
} as const;
```

### `UrlConfig`

| Property       | Type                                    | Description                                                                            |
| -------------- | --------------------------------------- | -------------------------------------------------------------------------------------- |
| `key`          | `string`                                | Key prefix for URL parameters. Defaults to `filters`.                                  |
| `encode`       | `boolean`                               | Whether to encode/decode URL parameters. Defaults to `true`.                            |
| `mergeParams`  | `boolean`                               | Whether to merge with existing URL params. Defaults to `true`.                           |
| `namespace`    | `string`                                | Namespace for multiple filter instances on the same page.                                |
| `serialize`    | `(filters: Record<string, any>) => string` | Function to serialize filters into a string for the URL.                                |
| `deserialize`  | `(query: string) => Record<string, any>` | Function to deserialize filters from a URL string.                                    |
| `transformers` | `Record<string, (value: any) => string>` | Transformation functions for specific filter keys.                                     |

### `StorageConfig`

| Property            | Type                                                    | Description                                                                    |
| ------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `type`              | `'local' \| 'session' \| 'memory' \| 'none'`              | Type of storage to use. Defaults to `none`.                                        |
| `key`               | `string`                                                | Key prefix for storage. Defaults to `filterize`.                                  |
| `version`           | `string`                                                | Version of the storage data.                                                     |
| `migrations`        | `MigrationStrategy[]`                                  | Array of migration strategies for upgrading the data version.                     |
| `include`           | `string[]`                                              | List of fields to include in storage. If empty, all fields are included.       |
| `exclude`           | `string[]`                                              | List of fields to exclude from storage.                                        |
| `compress`          | `boolean`                                               | Whether to compress stored data. Defaults to `false`.                              |
| `serialize`         | `(data: any) => string`                                  | Function to serialize data before storing it.                                    |
| `deserialize`       | `(data: string) => any`                                  | Function to deserialize data after retrieving it from storage.                   |
| `onMigrationComplete` | `(oldVersion: string, newVersion: string, data: any) => void` | Callback function called after migration is complete.                           |

### `FetchConfig`

| Property           | Type                                                 | Description                                                                                    |
| ------------------ | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `dependencies`     | `any[]`                                              | Array of dependencies. `fetch` will be called again when these values change.                |
| `debounceTime`     | `number`                                             | Debounce time (in milliseconds) for `fetch` calls. Defaults to 300.                           |
| `defaultValues`    | `Record<string, any>`                                | Default filter values when resetting.                                                         |
| `fetchOnEmpty`     | `boolean`                                            | Whether to fetch data when no filters are applied. Defaults to `false`.                     |
| `requiredFilters` | `string[]` | Array of filter keys that must have a value (non-null, non-undefined) for `fetch` to occur. |
| `shouldFetch`     | `(filters: Record<string, any>) => boolean \| Promise<boolean>` | Function to check `fetch` conditions.                                                            |
| `beforeFetch`      | `(filters: Record<string, any>) => Record<string, any> \| Promise<Record<string, any>>` | Function to transform filters before `fetch`.                                                     |
| `onMissingRequired` | `(missingFilters: string[]) => void`                   | Callback function called when `requiredFilters` are missing.                                     |
| `onFetchPrevented`  | `(filters: Record<string, any>) => void`              | Callback function called when `shouldFetch` returns `false`.                                    |

## Troubleshooting

### Error "Circular dependency detected..."

This error occurs when there is a circular dependency between filters. For example, filter A depends on filter B, filter B depends on filter C, and filter C depends on filter A.

**Solution:** Review the `dependencies` in the `FilterConfig` of the filters and ensure that there are no circular dependencies.

### Data is not updated when changing the filter

*   Check if the `fetch` function is using the latest filter values.
*   Check if the `dependencies` in the `useFilterize` options are configured correctly.
*   Make sure the `key` of each `FilterConfig` is unique.
*   Check if you have passed the correct `updateFilter` function to the filter components.

### Error "Uncaught TypeError: Cannot read properties of undefined..."

*   Check if the components are accessing the properties of `filters`, `data`, or `error` correctly, ensuring that they are initialized.
*   Make sure the `fetch` function is returning data in the correct format.

### Storage-related errors

*   Check if the `storage` options are configured correctly, including `type`, `key` (if using `local` or `session`), and `include`/`exclude` (if necessary).
*   Make sure the browser supports the type of storage you are using (localStorage or sessionStorage).

## Contributing

We welcome all contributions to `react-filterize`! If you would like to contribute, please follow these steps:

1. Fork this repository.
2. Create a new branch for your feature/bugfix: `git checkout -b feature/your-feature` or `git checkout -b bugfix/your-bugfix`.
3. Make the necessary changes.
4. Write tests for your changes.
5. Make sure all tests pass: `npm test` or `yarn test`.
6. Create a pull request to the `main` branch of this repository.

Please ensure that your pull request adheres to the following guidelines:

*   Clearly describe your changes.
*   Include tests for your changes.
*   Your code must follow the project's style guide.

## License

`react-filterize` is released under the MIT license. See the `LICENSE` file for more details.

## FAQs

### 1. How do I set the initial value for a filter from the URL?

`useFilterize` will automatically get the filter value from the URL if you configure `url: true` in the `options`. You can also provide `key` to customize the parameter name in the URL.

### 2. Can I use `react-filterize` with frameworks other than React?

No, `react-filterize` is designed to work with React and uses React Hooks.

### 3. How do I clear storage?

You can use the `storage.clear` function returned from the `useFilterize` hook to delete the storage. For example:

```tsx
const { storage } = useFilterize(...);

// ...

<button onClick={() => storage.clear()}>Clear Storage</button>
```

### 4. Can I change the display order of the filters?

The display order of the filters depends on the order of the `FilterConfig` in the `config` array that you pass to `useFilterize`. You can change the order of the elements in this array to change the display order.