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
  // Define filter configurations
  const config = [
    addFilter({
      key: 'search',
      type: ValueTypes.STRING,
      defaultValue: 'laptop',
      transform: (value: string) => value.toLowerCase(),
    }),
    addFilter({
      key: 'status',
      type: ValueTypes.STRING,
    }),
    addFilter({
      key: 'minPrice',
      type: ValueTypes.NUMBER,
    }),
    addFilter({
      key: 'maxPrice',
      type: ValueTypes.NUMBER,
    }),
    addFilter({
      key: 'rating',
      type: ValueTypes.NUMBER,
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
      // `options` go here
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
