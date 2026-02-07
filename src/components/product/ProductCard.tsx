'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Heart } from 'lucide-react';
import { Product } from '@/types';
import { Card, CardContent, CardFooter, Badge, Button } from '@/components/ui';
import { cn } from '@/lib/utils/cn';

export interface ProductCardProps {
  product: Product;
  onAddToCart?: (productId: number) => void;
  isLoading?: boolean;
  className?: string;
}

const ProductCard = ({
  product,
  onAddToCart,
  isLoading = false,
  className,
}: ProductCardProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (onAddToCart && !isAdding) {
      setIsAdding(true);
      try {
        await onAddToCart(product.id);
      } finally {
        setIsAdding(false);
      }
    }
  };

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsFavorite(!isFavorite);
  };

  const conditionColors = {
    Mint: 'success',
    Excellent: 'info',
    Good: 'warning',
    Fair: 'secondary',
  } as const;

  const primaryImage = product.images?.[0]?.imageUrl || '/placeholder-jersey.jpg';
  const imageAlt = product.images?.[0]?.altText || `${product.team} ${product.year} jersey`;

  return (
    <Link href={`/products/${product.id}`}>
      <Card
        variant="bordered"
        padding="none"
        className={cn(
          'group cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-xl',
          'h-full flex flex-col',
          isLoading && 'opacity-50 pointer-events-none',
          className
        )}
      >
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <Image
            src={primaryImage}
            alt={imageAlt}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          
          {product.featured && (
            <div className="absolute top-2 left-2">
              <Badge variant="danger" size="sm">Featured</Badge>
            </div>
          )}
          
          <div className="absolute top-2 right-2">
            <Badge variant={conditionColors[product.condition]} size="sm">
              {product.condition}
            </Badge>
          </div>

          <button
            onClick={toggleFavorite}
            className="absolute bottom-2 right-2 p-2 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-gray-100"
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart
              className={cn(
                'w-5 h-5 transition-colors',
                isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'
              )}
            />
          </button>

          {product.inventory === 0 && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <Badge variant="danger" size="lg">Out of Stock</Badge>
            </div>
          )}
        </div>

        <CardContent className="flex-1 p-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-blue-600 transition-colors">
              {product.name}
            </h3>
            
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span className="font-medium">{product.team}</span>
              <span>{product.year}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-gray-900">
                ${product.price.toFixed(2)}
              </span>
              <Badge variant="secondary" size="sm">
                Size {product.size}
              </Badge>
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0">
          <Button
            onClick={handleAddToCart}
            disabled={product.inventory === 0 || isAdding}
            className="w-full"
            variant={product.inventory === 0 ? 'secondary' : 'primary'}
          >
            {isAdding ? (
              'Adding...'
            ) : product.inventory === 0 ? (
              'Out of Stock'
            ) : (
              <>
                <ShoppingCart className="w-4 h-4 mr-2" />
                Add to Cart
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
};

export default ProductCard;
