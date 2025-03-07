import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import ProductControl from './ProductControl';
import FilterizeDemo from './FilterizeDemo';
import DependencyTest from './DependencyTest';

const App = () => {
  return (
    <div>
      {/* <ProductControl /> */}
      {/* <FilterizeDemo /> */}
      <DependencyTest />
    </div>
  );
};

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(<App />);
