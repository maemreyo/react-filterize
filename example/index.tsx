import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import ProductControl from './ProductControl';
import Demo from './Demo';

const App = () => {
  return (
    <div>
      <ProductControl />
      {/* <Demo /> */}
    </div>
  );
};

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(<App />);
