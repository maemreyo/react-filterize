import React from 'react';
import styled from 'styled-components';
import Filters from './Filters';
import ProductsGrid from './ProductGrid';
import { dummyData } from './data';
import {
  useFilterize,
  createFilterConfig,
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
  // Define filter configurations
  const filtersConfig = [
    createFilterConfig({
      key: 'search',
      label: 'Search',
      defaultValue: '',
      transform: (value: string) => value.toLowerCase(),
    }),
    createFilterConfig({
      key: 'status',
      label: 'Status',
      defaultValue: '',
      transform: (value: string) => value === 'true',
    }),
    createFilterConfig({
      key: 'minPrice',
      label: 'Min Price',
      type: ValueTypes.NUMBER,
      defaultValue: 0,
    }),
    createFilterConfig({
      key: 'maxPrice',
      label: 'Max Price',
      defaultValue: 0,
    }),
    createFilterConfig({
      key: 'rating',
      label: 'Min Rating',
      defaultValue: 0,
    }),
  ];

  console.log('filtersConfig', filtersConfig);

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
  } = useFilterize({
    filtersConfig,
    fetchData: fetchFilteredData,
    options: {
      syncWithUrl: true,
      urlFiltersKey: 'pf',
      // storage: {
      //   type: 'local',
      //   prefix: 'products-',
      // },
      autoFetch: true,
    },
  });

  console.log('filtesrs', filters);

  // Handler for filter changes
  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    updateFilter(name, value);
  };

  return (
    <Container>
      <Filters setFilters={handleFilterChange} />
      <Error isHidden={!error}>
        {error?.message || 'An error occurred while fetching the data.'}
      </Error>
      <Loading isHidden={!loading}>Loading...</Loading>
      <ProductsGrid products={products || []} loading={loading} />
    </Container>
  );
};

export default ProductControl;
