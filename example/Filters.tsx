import React from 'react';
import styled from 'styled-components';

const FiltersContainer = styled.div`
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
`;

const FiltersGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
`;

const FilterItem = styled.div`
  margin-bottom: 16px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
`;

const Input = styled.input`
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
`;

const Select = styled.select`
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
`;

interface FiltersProps {
  setFilters: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
}

const Filters: React.FC<FiltersProps> = ({ setFilters }) => {
  return (
    <FiltersContainer>
      <FiltersGrid>
        <FilterItem>
          <Label htmlFor="search">Search</Label>
          <Input
            type="text"
            id="search"
            name="search"
            placeholder="Search products..."
            autoComplete="off"
            onChange={setFilters}
          />
        </FilterItem>

        <FilterItem>
          <Label htmlFor="status">Status</Label>
          <Select id="status" name="status" onChange={setFilters}>
            <option value="">All</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </Select>
        </FilterItem>

        <FilterItem>
          <Label htmlFor="minPrice">Min Price</Label>
          <Input
            type="number"
            id="minPrice"
            name="minPrice"
            placeholder="Min price"
            onChange={setFilters}
          />
        </FilterItem>

        <FilterItem>
          <Label htmlFor="maxPrice">Max Price</Label>
          <Input
            type="number"
            id="maxPrice"
            name="maxPrice"
            placeholder="Max price"
            onChange={setFilters}
          />
        </FilterItem>

        <FilterItem>
          <Label htmlFor="rating">Min Rating</Label>
          <Input
            type="number"
            id="rating"
            name="rating"
            min="0"
            max="5"
            step="0.5"
            placeholder="Minimum rating"
            onChange={setFilters}
          />
        </FilterItem>
      </FiltersGrid>
    </FiltersContainer>
  );
};

export default Filters;
