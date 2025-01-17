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
  - [1. Filter Configuration](#1-filter-configuration)
  - [2. Performance Optimization](#2-performance-optimization)
  - [3. Error Handling](#3-error-handling)
  - [4. URL Synchronization](#4-url-synchronization)
  - [5. Retry](#5-retry)
  - [6. Transformations](#6-transformations)
- [Examples](#examples)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)
- [FAQs](#faqs)

## Installation

To install `@matthew.ngo/react-filterize`, run the following command:

```bash
npm install @matthew.ngo/react-filterize
```
or
```bash
yarn add @matthew.ngo/react-filterize
```

## Quick Start

Here's a simple example of how to use `useFilterize`:

```javascript
// example/ProductControl.tsx
import React from 'react';
import styled from 'styled-components';
import Filters from './Filters';
import ProductsGrid from './ProductGrid';
import { dummyData } from './data';
import {
  useFilterize,
  addFilter,
  ValueTypes,
} from '@matthew.ngo/react-filterize';

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
  // Define filter configuration
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
      type: ValueTypes.NUMBER
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
  const fetchFilteredData = async (filters: any) => {
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
  } = useFilterize({
    config,
    fetch: fetchFilteredData,
    options: {
      syncWithUrl: true,
      urlFiltersKey: 'pf',
      autoFetch: true,
    },
  });

  // Handle filter changes
  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    updateFilter(name, value);
  };

  return (
    <Container>
      <Filters filters={filters} setFilters={handleFilterChange} />
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

## Best Practices

### 1. Filter Configuration

-   Use `addFilter` to create configurations for each filter. This helps you easily manage the data type and other attributes of the filter.
-   Use the `transform` property to normalize the filter input data. For example, convert the search string to lowercase.

    ```javascript
    addFilter({
      key: 'search',
      label: 'Search',
      defaultValue: '',
      transform: (value: string) => value.toLowerCase(),
    });
    ```

-   Set `defaultValue` according to the data type of the filter.
-   For array `defaultValue` (empty or not), you can omit `type` key or explicitly set `type` to corresponding value:
    ```javascript
    addFilter({
        key: 'stringArr',
        defaultValue: [] // or ['a', 'b']
        // inferred type: string[]
        // type: ValueTypes.STRING_ARRAY // optional
      })

      addFilter({
        key: 'numberArr',
        defaultValue: [] // or [1, 2]
        // inferred type: number[]
        // type: ValueTypes.NUMBER_ARRAY // optional
      })

      addFilter({
        key: 'dateArr',
        defaultValue: [] // or [new Date()]
        // inferred type: date[]
        // type: ValueTypes.DATE_ARRAY // optional
      })

      addFilter({
        key: 'fileArr',
        defaultValue: []
        // inferred type: file[]
        // type: ValueTypes.FILE_ARRAY // optional
      })
    ```
### 2. Performance Optimization

-   Use `debounce` in `FilterConfig` to delay updating the filter until the user has stopped typing for a certain period. This helps reduce the number of unnecessary API calls.

    ```javascript
      addFilter({
        key: 'search',
        label: 'Search',
        defaultValue: '',
        debounce: 300, // Debounce time in milliseconds
      });
    ```
-   Use `useMemo` to memoize the results of expensive calculations, such as filtering data.
-   Use `useCallback` to avoid unnecessary re-renders of child components.
-   Leverage the built-in caching feature of `useFilterize` with the `cacheTimeout` option.

### 3. Error Handling

-   The `Error` component is provided to display error messages when an error occurs during the data fetching process.
-   Use the `error` state returned by `useFilterize` to display error messages to the user.

    ```tsx
    <Error isHidden={!error}>
        {error?.message || 'An error occurred while fetching the data.'}
    </Error>
    ```
### 4. URL Synchronization

-   Use the option `syncWithUrl: true` to synchronize the filter state with the URL. This allows users to share filtered links and return to the previous state using the browser's "back" button.
-   Customize `urlFiltersKey` to change the default query parameter key ('filters').
-   Set `encodeUrlFilters: true` (default) to encode filters in the URL using base64, avoiding special characters. Set it to `false` if you don't want to encode and keep filters as a `URLSearchParams` object.

### 5. Retry

-   Configure the `retry` options with the number of `attempts` and `delay` to automatically retry when fetching data fails.
-   `backoff`: Enable `backoff` mode (`true` by default) to increase the delay after each retry.

### 6. Transformations

-   Configure the `input` and `output` functions in the `transform` option to transform data before and after fetching.
-   The `input` function is used to change `filters` before passing them to the `fetch` function.
-   The `output` function is used to change `data` returned from `fetch` before saving it to the state.

## Examples

The `example` directory contains a complete example of using `@matthew.ngo/react-filterize` with React, styled-components, and TypeScript. You can refer to the code in this directory to better understand how to use the library.

## API Reference

### `useFilterize`

The main hook for using `@matthew.ngo/react-filterize`.

**Props:**

| Prop         | Type                                                           | Description                                                                                           | Default                                                                   |
| :----------- | :------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------ |
| `config` | `FilterConfig[]`                                              | An array of filter configurations.                                                                    | `[]`                                                                      |
| `fetch`    | `(filters: Partial<FilterValues<TConfig>>) => Promise<any>` | A function that fetches data based on the current filters.                                            | `undefined`                                                               |
| `options`      | `UseFilterizeProps<TConfig>['options']`                    | Additional options.                                                                                  | `{ syncWithUrl: false, urlFiltersKey: 'filters', encodeUrlFilters: true, autoFetch: true, storage: { type: 'none' }}` |

**Return Value:**

| Property        | Type                                                                                              | Description                                                                           |
| :-------------- | :------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------ |
| `filters`       | `Partial<FilterValues<TConfig>>`                                                                | An object containing the current values of the filters.                                |
| `updateFilter`  | `<K extends keyof FilterValues<TConfig>>(key: K, value: FilterValues<TConfig>[K]) => void`     | A function to update the value of a specific filter.                                 |
| `loading`       | `boolean`                                                                                         | The loading state of the data fetching process.                                       |
| `error`         | `Error \| null`                                                                                 | The error that occurred during the data fetching process (if any).                   |
| `data`          | `any`                                                                                           | The data fetched from the API.                                                        |
| `filterSource`  | `FilterSource`                                                                               | The source of current filter values: 'url', 'storage' or 'default'.               |
| `exportFilters` | `() => { filters: string }`                                                                       | Function to export filters as a serialized string.                                    |
| `importFilters` | `(data: { filters: string, groups?: string[] }) => void`                                      | Function to import filters from a serialized string.                                  |
| `fetch`     | `() => Promise<void>`                                                                          | Function to re-fetch data from API with current filters                               |
| `storage`       | `{ clear: () => Promise<void> }`                                                                | Function to clear storage                                                              |
| `reset` | `() => void` | Function to reset filters to `defaultValue` |
| `history` | `{ undo: () => void; redo: () => void; canUndo: boolean; canRedo: boolean; current: FilterHistoryState<Partial<FilterValues<TConfig>>>; past: FilterHistoryState<Partial<FilterValues<TConfig>>>[]; future: FilterHistoryState<Partial<FilterValues<TConfig>>>[] }` | Functions and states to manage filters change history (undo, redo, etc.) |

### `addFilter`

A utility function to create a configuration for a filter.

**Parameters:**

-   `config`: `FilterConfigWithoutType<T>`: An object containing the properties of the filter:
    -   `key`: `string` (required): The name of the filter.
    -   `label`: `string` (optional): The label of the filter, displayed in the UI.
    -   `defaultValue`: `T` (optional): The default value of the filter.
    -   `type`: `ValueTypeKey` (optional): The data type of the filter, inferred from `defaultValue` if `type` is not explicitly passed.
    -   `dependencies`?: `Record<string,(value: T extends null | undefined ? any : T) => any>` (optional): An object defining dependencies and corresponding dependency handling functions, see example [here](#dependencies).
    -   `transform`: `(value: T) => any` (optional): A function to normalize the value of the filter.
    -   `debounce`: `number` (optional): The debounce time (in milliseconds) for the filter.
    -   `required`?: `boolean` (optional): Whether the filter is required or not.
    -   `hidden`?: `boolean` (optional): Whether the filter is hidden or not.
    -   `disabled`?: `boolean` (optional): Whether the filter is disabled or not.

**Return Value:**

`FilterConfig`: An object containing the complete configuration of the filter.

### `ValueTypes`

An enum containing the supported data types for filters:

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

## Troubleshooting

**Issue:** `Circular dependency detected...` error

**Solution:** Check the `dependencies` option of the `FilterConfigs` to make sure there are no circular dependencies. For example, you should not declare filter A depends on filter B, filter B depends on filter C, and filter C depends on filter A.

**Issue:** Data is not being fetched

**Solution:**

-   Check the `fetch` function and make sure it returns the correct data.
-   Check for network errors.
-   Use `console.log` to debug the values of filters and data.
-   Make sure the `autoFetch` option is set to `true` (default) or call `fetch` function from `useFilterize` return value manually.

**Issue:** Filters are not in sync with the URL

**Solution:**

-   Make sure the `syncWithUrl` option is enabled.
-   Check if `urlFiltersKey` is configured correctly.
-   In case of `encodeUrlFilters: false`, filters are stored as a `URLSearchParams` object, the `key` corresponds to `FilterConfig.key`, `value` will be the serialized value of the corresponding filter.

**Issue:** Filter value is incorrect

**Solution:**

-   Check `defaultValue` of `FilterConfig`.
-   Check the `transform` function, if any.
-   Check the dependencies, make sure the `defaultValue` of the dependent filter is correct, and the dependency functions handle the logic correctly.

## Contributing

If you want to contribute to `@matthew.ngo/react-filterize`, please create a pull request on GitHub.

Contribution steps:

1. Fork the repository.
2. Create a new branch.
3. Make changes.
4. Write tests for the changes.
5. Make sure all tests pass.
6. Create a pull request.

## License

MIT License

Copyright (c) 2023 Matthew Ngo

## FAQs

**Q:** Does `@matthew.ngo/react-filterize` support TypeScript?

**A:** Yes, `@matthew.ngo/react-filterize` is written in TypeScript and provides complete type definitions.

**Q:** Can I use `@matthew.ngo/react-filterize` with frameworks other than React?

**A:** No, `@matthew.ngo/react-filterize` is designed to be used with React.

**Q:** How can I customize the UI of the filters?

**A:** You can create your own filter components and use the `updateFilter` function returned by `useFilterize` to update the values of the filters. See the example in `example/Filters.tsx` and `example/ProductControl.tsx`.

**Q:** What is the purpose of the `dependencies` option in `FilterConfig`?

**A:** The `dependencies` option allows you to define dependent filters (dependencies) and functions to calculate the filter value based on these dependencies. For example:

```typescript
// FilterConfig for the 'category' filter
addFilter({
  key: 'category',
  label: 'Category',
  defaultValue: '',
  type: ValueTypes.STRING,
});

// FilterConfig for the 'subCategory' filter that depends on 'category'
addFilter({
  key: 'subCategory',
  label: 'Sub-Category',
  defaultValue: '',
  type: ValueTypes.STRING,
  dependencies: {
    category: (categoryValue) => {
      // logic to get the list of sub-categories based on categoryValue
      // For example:
      if (categoryValue === 'electronics') {
        return ['phones', 'laptops', 'tablets'];
      } else if (categoryValue === 'books') {
        return ['fiction', 'non-fiction', 'science-fiction'];
      } else {
        return [];
      }
    },
  },
});
```

In this example, the `subCategory` filter depends on the `category` filter. When the value of the `category` filter changes, the corresponding dependency function will be called to calculate the new value for the `subCategory` filter. Please note that the values returned from the dependency function need to match the declared `defaultValue` (e.g., `''` or `[]`).