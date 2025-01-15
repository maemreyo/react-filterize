import React from 'react';
import { useFilterize } from '@matthew.ngo/react-filterize';

const AdvancedSearch = () => {
  const { filters, updateFilter, loading, data, filterHooks } = useFilterize({
    filtersConfig: [
      {
        key: 'search',
        type: 'query',
        defaultValue: '',
        debounce: 300,
        transform: value => value.toLowerCase().trim(),
      },
      {
        key: 'status',
        type: 'select',
        defaultValue: 'all',
        validation: value => ['all', 'active', 'inactive'].includes(value),
      },
    ],
    fetchData: async filters => {
      console.log('Fetching data with filters:', filters);

      return ['Item 1', 'Item 2', 'Item 3'];
    },
    options: {
      syncWithUrl: false,
      enableAnalytics: false,
      autoFetch: true,
    },
  });

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <input
        type="text"
        value={filters.search || ''}
        onChange={e => updateFilter('search', e.target.value)}
        placeholder="Search..."
      />

      <select
        value={filters.status}
        onChange={e => updateFilter('status', e.target.value)}
      >
        <option value="all">All</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>

      {/* Results */}
      <div>
        {data?.map(item => (
          <div key={item.id}>{/* Render your items */}</div>
        ))}
      </div>
    </div>
  );
};

export default AdvancedSearch;
