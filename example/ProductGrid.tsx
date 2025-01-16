import React from 'react';
import styled from 'styled-components';

const ProductsGridContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
`;

const ProductCard = styled.div`
  background: white;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const ProductStatus = styled.div`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  margin-bottom: 8px;
  background: ${props => (props.active ? '#e7f5e7' : '#fee7e7')};
  color: ${props => (props.active ? '#0a5d0a' : '#c42b2b')};
`;

const ProductTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
`;

const Tag = styled.span`
  background: #eee;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
`;

const ProductsGrid: React.FC<{ products: any[]; loading: boolean }> = ({
  products,
  loading,
}) => {
  if (loading) {
    return null;
  }

  return (
    <ProductsGridContainer>
      {products.map(product => (
        <ProductCard key={product.id}>
          <ProductStatus active={product.status}>
            {product.status ? 'Active' : 'Inactive'}
          </ProductStatus>
          <h3>{product.name}</h3>
          <p>Price: ${product.price}</p>
          <p>Rating: {product.rating}/5</p>
          <ProductTags>
            {product.tags.map((tag: string) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </ProductTags>
        </ProductCard>
      ))}
    </ProductsGridContainer>
  );
};

export default ProductsGrid;
