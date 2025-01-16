import React, { useState, useEffect, useCallback } from 'react';
import {
  useFilterize,
  createFilterConfig,
  FilterConfig,
  ValueTypeKey,
} from '@matthew.ngo/react-filterize';

const mockApi = async (filters: Record<string, any>) => {
  console.log('[mockApi] Received filters:', filters);
  const delay = Math.random() * 1000 + 500;
  await new Promise(resolve => setTimeout(resolve, delay));

  // Simulate potential API failure for demonstration purposes
  if (filters.simulateFailure) {
    throw new Error('API request failed');
  }

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

  // Apply filters
  const filteredItems = items.filter(item => {
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

  console.log('[mockApi] Returning filtered items:', filteredItems);
  return filteredItems;
};

// Define filter configurations
const filtersConfig: FilterConfig<ValueTypeKey>[] = [
  createFilterConfig({
    key: 'search',
    type: 'string',
    defaultValue: '',
    label: 'Search by Name',
  }),
  createFilterConfig({
    key: 'status',
    type: 'boolean',
    defaultValue: undefined,
    label: 'Status',
  }),
  createFilterConfig({
    key: 'priceRange',
    type: 'number[]',
    defaultValue: [0, 0] as [number, number],
    label: 'Price Range',
  }),
  createFilterConfig({
    key: 'rating',
    type: 'number',
    defaultValue: 0,
    label: 'Minimum Rating',
  }),
  createFilterConfig({
    key: 'tags',
    type: 'string[]',
    defaultValue: [] as string[],
    label: 'Tags',
  }),
  createFilterConfig({
    key: 'dateRange',
    type: 'date[]',
    defaultValue: [null, null] as [Date | null, Date | null],
    label: 'Date Range',
  }),
  createFilterConfig({
    key: 'simulateFailure',
    type: 'boolean',
    defaultValue: false,
    label: 'Simulate API Failure',
  }),
];

const App: React.FC = () => {
  const {
    filters,
    updateFilter,
    loading,
    error,
    data,
    analytics,
    fetchData,
    exportFilters,
    importFilters,
    storage,
    history,
  } = useFilterize({
    filtersConfig,
    fetchData: mockApi,
    options: {
      syncWithUrl: true,
      encodeUrlFilters: true,
      urlFiltersKey: 'f',
      storage: {
        type: 'local',
        prefix: 'filterize-demo-',
      },
      enableAnalytics: true,
      autoFetch: true, // Disable auto-fetch to demonstrate manual triggering
      retry: {
        attempts: 3,
        delay: 1000,
        backoff: true,
      },
    },
  });

  const handleInputChange = useCallback(
    (key: string, type: ValueTypeKey) => (
      event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
      let value: any;

      switch (type) {
        case 'string':
          value = event.target.value;
          break;
        case 'number':
          value = parseFloat(event.target.value) || 0;
          break;
        case 'boolean':
          value =
            event.target.type === 'checkbox' ? event.target.checked : null;
          break;
        case 'number[]':
          value = filters.priceRange?.slice() || [0, 0];
          if ((event.target as HTMLInputElement).id.endsWith('-min')) {
            value[0] = parseFloat(event.target.value) || 0;
          } else {
            value[1] = parseFloat(event.target.value) || 0;
          }
          break;
        case 'date[]':
          value = filters.dateRange?.slice() || [null, null];
          if ((event.target as HTMLInputElement).id.endsWith('-start')) {
            value[0] = event.target.value ? new Date(event.target.value) : null;
          } else {
            value[1] = event.target.value ? new Date(event.target.value) : null;
          }
          break;
        case 'string[]':
          value = Array.from(
            (event.target as HTMLSelectElement).selectedOptions
          ).map(option => option.value);
          break;
        default:
          value = event.target.value;
      }
      updateFilter(key, value);
    },
    [filters, updateFilter]
  );

  const handleFetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  const handleExport = useCallback(() => {
    const exportedData = exportFilters();
    console.log('[Export Filters] Data:', exportedData);
  }, [exportFilters]);

  const handleImport = useCallback(() => {
    const input = prompt('Enter exported data:');
    if (input) {
      importFilters({ filters: input });
      console.log('[Import Filters] Data imported.');
    }
  }, [importFilters]);

  const handleClearStorage = useCallback(() => {
    storage.clear();
    console.log('[Clear Storage] Storage cleared.');
  }, [storage]);

  const handleResetFilters = useCallback(() => {
    const resetValues = filtersConfig.reduce(
      (acc, config) => ({
        ...acc,
        [config.key]: config.defaultValue,
      }),
      {}
    );
    updateFilter('all', resetValues);
    console.log('[Reset Filters] Filters reset to default.');
  }, [updateFilter, filtersConfig]);

  const handleUndo = useCallback(() => {
    history.undo();
    console.log('[Undo] Last change undone.');
  }, [history]);

  const handleRedo = useCallback(() => {
    history.redo();
    console.log('[Redo] Last change redone.');
  }, [history]);

  useEffect(() => {
    if (analytics) {
      console.log('[Analytics]', analytics.getAnalyticsReport());
    }
  }, [analytics]);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Filter Demo</h1>
      <div>
        <h2>Filters</h2>
        {filtersConfig.map(config => (
          <div key={config.key} style={{ marginBottom: '10px' }}>
            {config.type === 'boolean' && (
              <>
                <input
                  type="checkbox"
                  id={config.key}
                  checked={filters[config.key] ?? config.defaultValue}
                  onChange={handleInputChange(config.key, config.type)}
                />
                <label htmlFor={config.key}>{config.label}</label>
              </>
            )}
            {config.type === 'string' && (
              <>
                <label htmlFor={config.key}>{config.label}</label>
                <input
                  type="text"
                  id={config.key}
                  value={filters[config.key] || ''}
                  onChange={handleInputChange(config.key, config.type)}
                />
              </>
            )}
            {config.type === 'number' && (
              <>
                <label htmlFor={config.key}>{config.label}</label>
                <input
                  type="number"
                  id={config.key}
                  value={filters[config.key] || ''}
                  onChange={handleInputChange(config.key, config.type)}
                />
              </>
            )}
            {config.type === 'number[]' && (
              <>
                <label>{config.label}</label>
                <input
                  type="number"
                  id={`${config.key}-min`}
                  value={filters.priceRange?.[0] || 0}
                  onChange={handleInputChange(config.key, config.type)}
                />
                <input
                  type="number"
                  id={`${config.key}-max`}
                  value={filters.priceRange?.[1] || 0}
                  onChange={handleInputChange(config.key, config.type)}
                />
              </>
            )}
            {config.type === 'string[]' && (
              <>
                <label htmlFor={config.key}>{config.label}</label>
                <select
                  multiple
                  id={config.key}
                  value={filters.tags || []}
                  onChange={handleInputChange(config.key, config.type)}
                >
                  <option value="electronics">Electronics</option>
                  <option value="work">Work</option>
                  <option value="mobile">Mobile</option>
                  <option value="wearable">Wearable</option>
                  <option value="audio">Audio</option>
                </select>
              </>
            )}
            {config.type === 'date[]' && (
              <>
                <label>{config.label}</label>
                <input
                  type="date"
                  id={`${config.key}-start`}
                  value={
                    filters.dateRange?.[0]
                      ? filters.dateRange[0].toISOString().split('T')[0]
                      : ''
                  }
                  onChange={handleInputChange(config.key, config.type)}
                />
                <input
                  type="date"
                  id={`${config.key}-end`}
                  value={
                    filters.dateRange?.[1]
                      ? filters.dateRange[1].toISOString().split('T')[0]
                      : ''
                  }
                  onChange={handleInputChange(config.key, config.type)}
                />
              </>
            )}
          </div>
        ))}
        <button onClick={handleFetch} disabled={loading}>
          {loading ? 'Fetching...' : 'Fetch Data'}
        </button>
        <button onClick={handleResetFilters}>Reset Filters</button>
        <button onClick={handleExport}>Export Filters</button>
        <button onClick={handleImport}>Import Filters</button>
        <button onClick={handleClearStorage}>Clear Storage</button>
        <button onClick={handleUndo} disabled={!history.canUndo}>
          Undo
        </button>
        <button onClick={handleRedo} disabled={!history.canRedo}>
          Redo
        </button>
      </div>

      {error && (
        <div style={{ color: 'red' }}>
          <h2>Error</h2>
          <p>{error.message}</p>
        </div>
      )}

      {data && (
        <div>
          <h2>Data</h2>
          <ul>
            {data.map((item: any) => (
              <li key={item.id}>
                {item.name} - ${item.price} - Rating: {item.rating} - Tags:{' '}
                {item.tags.join(', ')} - Last Updated:{' '}
                {item.lastUpdated.toLocaleDateString()}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default App;
