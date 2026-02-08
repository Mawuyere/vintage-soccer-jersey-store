'use client';

import { useState } from 'react';
import { ShoppingCart, Heart, Share2, Ruler, Package, Shield, Truck } from 'lucide-react';
import { Product } from '@/types';
import { Badge, Button } from '@/components/ui';
import { cn } from '@/lib/utils/cn';

export interface ProductDetailsProps {
  product: Product;
  onAddToCart?: (productId: number, quantity: number) => Promise<void>;
  className?: string;
}

const ProductDetails = ({
  product,
  onAddToCart,
  className,
}: ProductDetailsProps) => {
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  const handleAddToCart = async () => {
    if (onAddToCart && !isAdding) {
      setIsAdding(true);
      try {
        await onAddToCart(product.id, quantity);
      } finally {
        setIsAdding(false);
      }
    }
  };

  const handleQuantityChange = (value: number) => {
    const newQuantity = Math.max(1, Math.min(value, product.inventory));
    setQuantity(newQuantity);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: `Check out this ${product.team} jersey from ${product.year}`,
          url: window.location.href,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      setShowShareMenu(true);
      setTimeout(() => setShowShareMenu(false), 3000);
    }
  };

  const conditionColors = {
    Mint: 'success',
    Excellent: 'info',
    Good: 'warning',
    Fair: 'secondary',
  } as const;

  const conditionDescriptions = {
    Mint: 'Perfect condition, like new',
    Excellent: 'Minimal signs of wear',
    Good: 'Some visible wear but well maintained',
    Fair: 'Notable wear but still wearable',
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div>
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {product.name}
            </h1>
            <div className="flex items-center gap-3 text-gray-600">
              <span className="text-lg font-medium">{product.team}</span>
              <span className="text-gray-400">•</span>
              <span className="text-lg">{product.year}</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart
                className={cn(
                  'w-5 h-5',
                  isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'
                )}
              />
            </button>
            <button
              onClick={handleShare}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors relative"
              aria-label="Share product"
            >
              <Share2 className="w-5 h-5 text-gray-600" />
              {showShareMenu && (
                <div className="absolute top-full right-0 mt-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap">
                  Link copied!
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant={conditionColors[product.condition]}>
            {product.condition} Condition
          </Badge>
          <Badge variant="secondary">Size {product.size}</Badge>
          {product.featured && <Badge variant="danger">Featured</Badge>}
          {product.inventory < 5 && product.inventory > 0 && (
            <Badge variant="warning">Only {product.inventory} left</Badge>
          )}
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-gray-900">
            ${product.price.toFixed(2)}
          </span>
          <span className="text-gray-500">USD</span>
        </div>
      </div>

      {/* Condition Details */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-5 h-5 text-gray-600" />
          <span className="font-medium text-gray-900">Condition</span>
        </div>
        <p className="text-sm text-gray-600">
          {conditionDescriptions[product.condition]}
        </p>
      </div>

      {/* Quantity Selector */}
      {product.inventory > 0 && (
        <div>
          <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
            Quantity
          </label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleQuantityChange(quantity - 1)}
              disabled={quantity <= 1}
              className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Decrease quantity"
            >
              -
            </button>
            <input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
              min="1"
              max={product.inventory}
              className="w-20 h-10 text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              aria-label="Quantity"
            />
            <button
              onClick={() => handleQuantityChange(quantity + 1)}
              disabled={quantity >= product.inventory}
              className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Increase quantity"
            >
              +
            </button>
            <span className="text-sm text-gray-600">
              {product.inventory} available
            </span>
          </div>
        </div>
      )}

      {/* Add to Cart Button */}
      <div className="flex gap-3">
        <Button
          onClick={handleAddToCart}
          disabled={product.inventory === 0 || isAdding}
          className="flex-1"
          size="lg"
          variant={product.inventory === 0 ? 'secondary' : 'primary'}
        >
          {isAdding ? (
            'Adding to Cart...'
          ) : product.inventory === 0 ? (
            'Out of Stock'
          ) : (
            <>
              <ShoppingCart className="w-5 h-5 mr-2" />
              Add to Cart
            </>
          )}
        </Button>
      </div>

      {/* Product Info */}
      <div className="space-y-4 border-t border-gray-200 pt-6">
        <div className="flex items-start gap-3">
          <Ruler className="w-5 h-5 text-gray-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-gray-900 mb-1">Size</h3>
            <p className="text-sm text-gray-600">
              {product.size} - Please check our size guide for accurate measurements
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Package className="w-5 h-5 text-gray-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-gray-900 mb-1">SKU</h3>
            <p className="text-sm text-gray-600 font-mono">{product.sku}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Truck className="w-5 h-5 text-gray-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-gray-900 mb-1">Shipping</h3>
            <p className="text-sm text-gray-600">
              Free shipping on orders over $100. Standard delivery in 3-5 business days.
            </p>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="border-t border-gray-200 pt-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Description</h2>
        <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
          {product.description}
        </p>
      </div>
    </div>
  );
};

export default ProductDetails;
