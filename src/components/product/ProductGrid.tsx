'use client';

import { Product } from '@/types';
import { LoadingSpinner, ErrorMessage } from '@/components/ui';
import ProductCard from './ProductCard';
import { cn } from '@/lib/utils/cn';

export interface ProductGridProps {
  products: Product[];
  isLoading?: boolean;
  error?: string | null;
  onAddToCart?: (productId: number) => void;
  emptyMessage?: string;
  className?: string;
  columns?: 2 | 3 | 4;
}

const ProductGrid = ({
  products,
  isLoading = false,
  error = null,
  onAddToCart,
  emptyMessage = 'No products found',
  className,
  columns = 3,
}: ProductGridProps) => {
  const gridColumns = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12">
        <ErrorMessage message={error} />
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <svg
          className="w-24 h-24 text-gray-300 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
        <p className="text-lg font-medium text-gray-600">{emptyMessage}</p>
        <p className="text-sm text-gray-500 mt-2">
          Try adjusting your filters or search terms
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'grid gap-6',
        gridColumns[columns],
        className
      )}
    >
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={onAddToCart}
        />
      ))}
    </div>
  );
};

export default ProductGrid;
