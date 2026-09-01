/**
 * BuggyProductCard.jsx
 * 
 * Demo fixture for ProtoPatch ScreenToPatch mode.
 * This component has an intentional layout/margin bug:
 * - The price badge overlaps the product image due to incorrect positioning
 * - The "Add to Cart" button has a missing margin causing it to touch the description
 * - Mobile: the card grid collapses incorrectly at 375px
 * 
 * BUG: `.price-badge` has `top: -8px` but should be `top: 8px`
 * BUG: `.add-to-cart-btn` has `marginTop: 0` but should be `marginTop: '12px'`
 */

import React, { useState } from 'react';
import './ProductCard.css';

const BuggyProductCard = ({ product }) => {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  const handleAddToCart = () => {
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  return (
    <div className="product-card">
      {/* Product Image Container — BUG: price-badge overlaps image incorrectly */}
      <div className="product-image-container" style={{ position: 'relative' }}>
        <img
          src={product.imageUrl}
          alt={product.name}
          className="product-image"
          loading="lazy"
        />
        
        {/* BUG HERE: top: -8px causes badge to clip outside container */}
        <div className="price-badge" style={{ position: 'absolute', top: '-8px', right: '12px' }}>
          ${product.price}
        </div>

        <button
          className={`wishlist-btn ${isWishlisted ? 'wishlisted' : ''}`}
          onClick={() => setIsWishlisted(!isWishlisted)}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          {isWishlisted ? '❤️' : '🤍'}
        </button>
      </div>

      {/* Product Info */}
      <div className="product-info">
        <div className="product-category">{product.category}</div>
        <h3 className="product-name">{product.name}</h3>
        <p className="product-description">{product.description}</p>

        {/* BUG HERE: marginTop: 0 causes button to touch description text */}
        <button
          className={`add-to-cart-btn ${addedToCart ? 'added' : ''}`}
          onClick={handleAddToCart}
          style={{ marginTop: 0 /* should be 12px */ }}
          disabled={addedToCart}
        >
          {addedToCart ? '✓ Added to Cart' : 'Add to Cart'}
        </button>
      </div>

      {/* Rating - BUG: flex layout breaks at 375px due to no flex-wrap */}
      <div className="product-rating" style={{ display: 'flex', alignItems: 'center' }}>
        <div className="stars">
          {'★'.repeat(Math.floor(product.rating))}{'☆'.repeat(5 - Math.floor(product.rating))}
        </div>
        <span className="rating-count">({product.reviewCount} reviews)</span>
        {product.isBestseller && (
          <span className="bestseller-badge">🏆 Bestseller</span>
        )}
      </div>
    </div>
  );
};

// Demo usage
const ProductGrid = () => {
  const demoProducts = [
    {
      id: 1,
      name: 'Wireless Mechanical Keyboard',
      category: 'Electronics',
      price: 129.99,
      description: 'Compact 75% layout with hot-swappable switches and RGB backlighting.',
      imageUrl: 'https://placehold.co/400x300/1e293b/818cf8?text=Keyboard',
      rating: 4.5,
      reviewCount: 1203,
      isBestseller: true,
    },
    {
      id: 2,
      name: 'Ergonomic Desk Mat',
      category: 'Accessories',
      price: 34.99,
      description: 'Extended XXL mouse pad with stitched edges and non-slip base.',
      imageUrl: 'https://placehold.co/400x300/1e293b/c084fc?text=Desk+Mat',
      rating: 4,
      reviewCount: 567,
      isBestseller: false,
    },
  ];

  return (
    <div className="product-grid">
      {demoProducts.map(product => (
        <BuggyProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};

export default ProductGrid;
