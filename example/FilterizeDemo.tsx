import React, { useState } from 'react';
import {
  useFilterize,
  addFilter,
  ValueTypes,
} from '@matthew.ngo/react-filterize';

// Mock data
const generateProducts = (count = 20) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Product ${i + 1}`,
    price: Math.floor(Math.random() * 1000) + 10,
    status: Math.random() > 0.5,
    rating: Math.floor(Math.random() * 5) + 1,
    category: ['Electronics', 'Books', 'Clothing'][
      Math.floor(Math.random() * 3)
    ],
    createdAt: new Date(Date.now() - Math.random() * 10000000000),
  }));
};

const dummyData = generateProducts();

const FilterizeDemo = () => {
  // Demo configuration state
  const [useUrl, setUseUrl] = useState(false);
  const [useStorage, setUseStorage] = useState(false);
  const [useAutoFetch, setUseAutoFetch] = useState(true);
  const [useCacheTimeout, setUseCacheTimeout] = useState(false);
  const [useRetry, setUseRetry] = useState(false);
  const [useTransform, setUseTransform] = useState(false);
  const [useCustomFetch, setUseCustomFetch] = useState(false);
  const [useDefaults, setUseDefaults] = useState(false);

  // Filter configuration
  const config = [
    addFilter({
      key: 'search',
      type: ValueTypes.STRING,
      label: 'Search',
    }),
    addFilter({
      key: 'category',
      type: ValueTypes.STRING,
      label: 'Category',
    }),
    addFilter({
      key: 'minPrice',
      type: ValueTypes.NUMBER,
      label: 'Min Price',
    }),
    addFilter({
      key: 'maxPrice',
      type: ValueTypes.NUMBER,
      label: 'Max Price',
    }),
    addFilter({
      key: 'rating',
      type: ValueTypes.NUMBER,
      label: 'Min Rating',
    }),
    addFilter({
      key: 'status',
      type: ValueTypes.BOOLEAN,
      label: 'In Stock',
    }),
  ];

  // Build options based on configuration
  const options = {
    url: useUrl
      ? {
          key: 'demo',
          encode: true,
          mergeParams: true,
        }
      : false,

    storage: useStorage
      ? {
          type: 'local',
          key: 'filterize-demo',
          version: '1.0.0',
        }
      : undefined,

    autoFetch: useAutoFetch,

    cacheTimeout: useCacheTimeout ? 5000 : undefined,

    retry: useRetry
      ? {
          attempts: 3,
          delay: 1000,
          backoff: true,
        }
      : undefined,

    transform: useTransform
      ? {
          input: data => ({ ...data, timestamp: Date.now() }),
          output: data =>
            data.map(item => ({
              ...item,
              price: `$${item.price.toFixed(2)}`,
            })),
        }
      : undefined,

    fetch: useCustomFetch
      ? {
          debounceTime: 500,
          fetchOnEmpty: false,
          requiredFilters: ['category'],
          shouldFetch: filters => Object.keys(filters).length > 0,
          beforeFetch: filters => ({
            ...filters,
            timestamp: Date.now(),
          }),
        }
      : undefined,

    defaults: useDefaults
      ? {
          initialValues: {
            category: 'Electronics',
            minPrice: 0,
          },
          resetValues: {
            category: 'All',
            minPrice: 0,
          },
        }
      : undefined,
  };

  // Mock fetch function
  const fetch = async filters => {
    await new Promise(resolve => setTimeout(resolve, 500));

    return dummyData.filter(item => {
      const searchMatch =
        !filters.search ||
        item.name.toLowerCase().includes(filters.search.toLowerCase());
      const categoryMatch =
        !filters.category || item.category === filters.category;
      const minPriceMatch = !filters.minPrice || item.price >= filters.minPrice;
      const maxPriceMatch = !filters.maxPrice || item.price <= filters.maxPrice;
      const ratingMatch = !filters.rating || item.rating >= filters.rating;
      const statusMatch =
        filters.status === undefined || item.status === filters.status;

      return (
        searchMatch &&
        categoryMatch &&
        minPriceMatch &&
        maxPriceMatch &&
        ratingMatch &&
        statusMatch
      );
    });
  };

  const {
    filters,
    updateFilter,
    loading,
    error,
    data: products,
    refetch,
    reset,
    history,
  } = useFilterize({
    config,
    fetch,
    options,
  });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6 space-y-4">
        <h1 className="text-2xl font-bold">Filterize Demo</h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={useUrl}
              onChange={e => setUseUrl(e.target.checked)}
            />
            <span>URL Sync</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={useStorage}
              onChange={e => setUseStorage(e.target.checked)}
            />
            <span>Storage</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={useAutoFetch}
              onChange={e => setUseAutoFetch(e.target.checked)}
            />
            <span>Auto Fetch</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={useCacheTimeout}
              onChange={e => setUseCacheTimeout(e.target.checked)}
            />
            <span>Cache Timeout</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={useRetry}
              onChange={e => setUseRetry(e.target.checked)}
            />
            <span>Retry</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={useTransform}
              onChange={e => setUseTransform(e.target.checked)}
            />
            <span>Transform</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={useCustomFetch}
              onChange={e => setUseCustomFetch(e.target.checked)}
            />
            <span>Custom Fetch</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={useDefaults}
              onChange={e => setUseDefaults(e.target.checked)}
            />
            <span>Defaults</span>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <input
          type="text"
          placeholder="Search products..."
          value={filters.search || ''}
          onChange={e => updateFilter('search', e.target.value)}
          className="p-2 border rounded"
        />

        <select
          value={filters.category || ''}
          onChange={e => updateFilter('category', e.target.value)}
          className="p-2 border rounded"
        >
          <option value="">All Categories</option>
          <option value="Electronics">Electronics</option>
          <option value="Books">Books</option>
          <option value="Clothing">Clothing</option>
        </select>

        <input
          type="number"
          placeholder="Min Price"
          value={filters.minPrice || ''}
          onChange={e => updateFilter('minPrice', Number(e.target.value))}
          className="p-2 border rounded"
        />

        <input
          type="number"
          placeholder="Max Price"
          value={filters.maxPrice || ''}
          onChange={e => updateFilter('maxPrice', Number(e.target.value))}
          className="p-2 border rounded"
        />

        <input
          type="number"
          placeholder="Min Rating"
          min="1"
          max="5"
          value={filters.rating || ''}
          onChange={e => updateFilter('rating', Number(e.target.value))}
          className="p-2 border rounded"
        />

        <select
          value={filters.status?.toString() || ''}
          onChange={e =>
            updateFilter(
              'status',
              e.target.value === '' ? undefined : e.target.value === 'true'
            )
          }
          className="p-2 border rounded"
        >
          <option value="">All Status</option>
          <option value="true">In Stock</option>
          <option value="false">Out of Stock</option>
        </select>
      </div>

      <div className="flex space-x-4 mb-6">
        <button
          onClick={refetch}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Refetch
        </button>

        <button
          onClick={reset}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Reset
        </button>

        <button
          onClick={history.undo}
          disabled={!history.canUndo}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
        >
          Undo
        </button>

        <button
          onClick={history.redo}
          disabled={!history.canRedo}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
        >
          Redo
        </button>
      </div>

      {error && (
        <div className="p-4 mb-6 bg-red-100 text-red-700 rounded">
          {error.message}
        </div>
      )}

      {loading ? (
        <div className="text-center p-8">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products?.map(product => (
            <div key={product.id} className="border rounded p-4 space-y-2">
              <h3 className="font-bold">{product.name}</h3>
              <p>Category: {product.category}</p>
              <p>Price: ${product.price}</p>
              <p>Rating: {product.rating}/5</p>
              <p>Status: {product.status ? 'In Stock' : 'Out of Stock'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FilterizeDemo;
