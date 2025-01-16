import React, { useState } from 'react';
import {
  useFilterize,
} from '@matthew.ngo/react-filterize';

const mockApi = async (filters: Record<string, any>) => {
  const delay = Math.random() * 1000 + 500;
  await new Promise(resolve => setTimeout(resolve, delay));

  if (Math.random() < 0.5) {
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
    description: 'Search by product name',
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
    label: 'Product Status',
    description: 'Filter by product availability',
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
    fetchData: refetch,
  } = useFilterize({
    filtersConfig,
    fetchData: async filters => {
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
        input: filters => ({
          ...filters,
          _t: Date.now(),
        }),
        output: data => ({
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
        {data?.items.length === 0 && (
          <div className="text-gray-500">No results found</div>
        )}
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
