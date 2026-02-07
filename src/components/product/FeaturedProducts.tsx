'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { Product } from '@/types';
import { LoadingSpinner, ErrorMessage, Button } from '@/components/ui';
import ProductCard from './ProductCard';
import { cn } from '@/lib/utils/cn';

export interface FeaturedProductsProps {
  products?: Product[];
  isLoading?: boolean;
  error?: string | null;
  onAddToCart?: (productId: number) => void;
  title?: string;
  showControls?: boolean;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  className?: string;
}

const FeaturedProducts = ({
  products = [],
  isLoading = false,
  error = null,
  onAddToCart,
  title = 'Featured Products',
  showControls = true,
  autoPlay = true,
  autoPlayInterval = 5000,
  className,
}: FeaturedProductsProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(autoPlay);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);

  const itemsPerView = {
    mobile: 1,
    tablet: 2,
    desktop: 3,
    wide: 4,
  };

  const maxIndex = Math.max(0, products.length - itemsPerView.desktop);

  useEffect(() => {
    if (isAutoPlaying && products.length > itemsPerView.desktop && !isLoading) {
      autoPlayTimerRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
      }, autoPlayInterval);

      return () => {
        if (autoPlayTimerRef.current) {
          clearInterval(autoPlayTimerRef.current);
        }
      };
    }
  }, [isAutoPlaying, products.length, maxIndex, autoPlayInterval, isLoading, itemsPerView.desktop]);

  const handlePrevious = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));
  };

  const handleDotClick = (index: number) => {
    setIsAutoPlaying(false);
    setCurrentIndex(index);
  };

  if (isLoading) {
    return (
      <div className={cn('py-12', className)}>
        <div className="flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('py-12', className)}>
        <ErrorMessage message={error} />
      </div>
    );
  }

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section className={cn('py-12', className)} aria-labelledby="featured-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
            <h2 id="featured-heading" className="text-3xl font-bold text-gray-900">
              {title}
            </h2>
          </div>

          {showControls && products.length > itemsPerView.desktop && (
            <div className="hidden md:flex items-center gap-2">
              <Button
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                variant="secondary"
                size="sm"
                className="p-2"
                aria-label="Previous products"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button
                onClick={handleNext}
                disabled={currentIndex >= maxIndex}
                variant="secondary"
                size="sm"
                className="p-2"
                aria-label="Next products"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          )}
        </div>

        {/* Carousel */}
        <div className="relative">
          <div
            ref={scrollContainerRef}
            className="overflow-hidden"
            role="region"
            aria-live="polite"
            aria-atomic="true"
          >
            <div
              className="flex transition-transform duration-500 ease-in-out gap-6"
              style={{
                transform: `translateX(-${currentIndex * (100 / itemsPerView.desktop)}%)`,
              }}
            >
              {products.map((product) => (
                <div
                  key={product.id}
                  className="flex-shrink-0 w-full sm:w-1/2 lg:w-1/3 xl:w-1/4"
                >
                  <ProductCard product={product} onAddToCart={onAddToCart} />
                </div>
              ))}
            </div>
          </div>

          {/* Mobile Controls */}
          {showControls && products.length > 1 && (
            <div className="md:hidden">
              <button
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Previous products"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNext}
                disabled={currentIndex >= maxIndex}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Next products"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Dots Indicator */}
        {showControls && products.length > itemsPerView.desktop && (
          <div className="flex items-center justify-center gap-2 mt-6">
            {Array.from({ length: maxIndex + 1 }).map((_, index) => (
              <button
                key={index}
                onClick={() => handleDotClick(index)}
                className={cn(
                  'w-2 h-2 rounded-full transition-all duration-300',
                  currentIndex === index
                    ? 'bg-blue-600 w-8'
                    : 'bg-gray-300 hover:bg-gray-400'
                )}
                aria-label={`Go to slide ${index + 1}`}
                aria-current={currentIndex === index ? 'true' : 'false'}
              />
            ))}
          </div>
        )}

        {/* Grid View for Small Products Count */}
        {products.length <= itemsPerView.desktop && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedProducts;
