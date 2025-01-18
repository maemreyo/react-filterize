import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import ProductControl from './ProductControl';
import FilterizeDemo from './FilterizeDemo';

const App = () => {
  return (
    <div>
      {/* <ProductControl /> */}
      <FilterizeDemo />
    </div>
  );
};

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(<App />);
