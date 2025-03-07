import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from 'react';
import styled from 'styled-components';
import { addFilter, ValueTypes } from '../src/types/index';
import { useFilterize } from '../src/index';

const Container = styled.div`
  padding: 20px;
  background: #f5f5f5;
  max-width: 1200px;
  margin: 0 auto;
`;

const Card = styled.div`
  background: white;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 16px;
`;

const Button = styled.button`
  background: #4a90e2;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  margin-right: 8px;
  cursor: pointer;
  &:hover {
    background: #357ae8;
  }
`;

const DependencyTest: React.FC = () => {
  // State for dependency testing
  const [counter, setCounter] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Tạo dependency objects với useMemo để tránh tạo mới mỗi lần render
  const paginationDep = useMemo(
    () => ({
      pageIndex: pageIndex + 1,
      pageSize,
    }),
    [pageIndex, pageSize]
  );

  const counterDep = useMemo(() => ({ counter }), [counter]);

  // Sử dụng useMemo cho mảng dependencies để tránh tạo mới mỗi lần render
  const dependencies = useMemo(() => [paginationDep, counterDep], [
    paginationDep,
    counterDep,
  ]);

  // Memoize config để tránh tạo mới mỗi lần render
  const config = useMemo(
    () => [
      addFilter({
        key: 'search',
        type: ValueTypes.STRING,
      }),
      addFilter({
        key: 'pageIndex',
        type: ValueTypes.NUMBER,
        defaultValue: 1,
      }),
      addFilter({
        key: 'pageSize',
        type: ValueTypes.NUMBER,
        defaultValue: 10,
      }),
    ],
    []
  );

  // Memoize fetch function để tránh tạo mới mỗi lần render
  const fetch = useCallback(
    async (filters: any) => {
      console.log('Fetching with filters:', filters);
      await new Promise(resolve => setTimeout(resolve, 500));
      return Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        name: `Item ${i + 1}`,
        counter: counter,
      }));
    },
    [counter]
  );

  // Initialize useFilterize với dependencies đã được memoize
  const { filters, updateFilter, loading, data, refetch } = useFilterize({
    config,
    fetch,
    options: {
      //   autoFetch: false,
      fetch: {
        dependencies, // Sử dụng mảng dependencies đã được memoize
        debounceTime: 300,
      },
    },
  });

  // Log for debugging
  console.log('Render with:', {
    paginationDep,
    counterDep,
    filters,
    loading,
    data,
  });

  return (
    <Container>
      <h1>Dependency Test</h1>

      <Card>
        <h2>Dependencies</h2>
        <div>
          <p>Counter: {counter}</p>
          <p>Page Index: {pageIndex}</p>
          <p>Page Size: {pageSize}</p>
        </div>
        <div style={{ marginTop: '16px' }}>
          <Button onClick={() => setCounter(c => c + 1)}>
            Increment Counter
          </Button>
          <Button onClick={() => setPageIndex(p => p + 1)}>Next Page</Button>
          <Button onClick={() => setPageIndex(p => Math.max(0, p - 1))}>
            Previous Page
          </Button>
          <Button onClick={() => setPageSize(p => (p === 10 ? 20 : 10))}>
            Toggle Page Size
          </Button>
        </div>
      </Card>

      <Card>
        <h2>Filters</h2>
        <div>
          <input
            type="text"
            placeholder="Search..."
            value={filters.search || ''}
            onChange={e => updateFilter('search', e.target.value)}
            style={{ padding: '8px', marginRight: '8px' }}
          />
          <Button onClick={refetch}>Refetch</Button>
        </div>
      </Card>

      <Card>
        <h2>Results</h2>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div>
            <p>Total items: {data?.length || 0}</p>
            <ul>
              {data?.map((item: any) => (
                <li key={item.id}>
                  {item.name} (Counter: {item.counter})
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>
    </Container>
  );
};

export default DependencyTest;
