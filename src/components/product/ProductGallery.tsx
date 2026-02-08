'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Expand } from 'lucide-react';
import { ProductImage } from '@/types';
import { Modal } from '@/components/ui';
import { cn } from '@/lib/utils/cn';

export interface ProductGalleryProps {
  images: ProductImage[];
  productName: string;
  className?: string;
}

const ProductGallery = ({
  images,
  productName,
  className,
}: ProductGalleryProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const sortedImages = [...images].sort((a, b) => a.displayOrder - b.displayOrder);
  const currentImage = sortedImages[selectedIndex] || {
    imageUrl: '/placeholder-jersey.jpg',
    altText: productName,
  };

  const handlePrevious = () => {
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : sortedImages.length - 1));
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev < sortedImages.length - 1 ? prev + 1 : 0));
  };

  const handleThumbnailClick = (index: number) => {
    setSelectedIndex(index);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      handlePrevious();
    } else if (e.key === 'ArrowRight') {
      handleNext();
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Main Image */}
      <div
        className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group"
        onKeyDown={handleKeyDown}
        role="region"
        aria-label="Product image gallery"
        tabIndex={0}
      >
        <Image
          src={currentImage.imageUrl}
          alt={currentImage.altText || productName}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />

        {/* Navigation Arrows */}
        {sortedImages.length > 1 && (
          <>
            <button
              onClick={handlePrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Expand Button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="absolute top-2 right-2 p-2 bg-white/80 hover:bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="View full size"
        >
          <Expand className="w-5 h-5" />
        </button>

        {/* Image Counter */}
        {sortedImages.length > 1 && (
          <div className="absolute bottom-2 right-2 px-3 py-1 bg-black/60 text-white text-sm rounded-full">
            {selectedIndex + 1} / {sortedImages.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {sortedImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {sortedImages.map((image, index) => (
            <button
              key={image.id}
              onClick={() => handleThumbnailClick(index)}
              className={cn(
                'relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all',
                selectedIndex === index
                  ? 'border-blue-600 ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-gray-400'
              )}
              aria-label={`View image ${index + 1}`}
              aria-pressed={selectedIndex === index}
            >
              <Image
                src={image.imageUrl}
                alt={image.altText || `${productName} thumbnail ${index + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}

      {/* Full Size Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={currentImage.altText || productName}
        size="full"
      >
        <div className="relative w-full h-[80vh]">
          <Image
            src={currentImage.imageUrl}
            alt={currentImage.altText || productName}
            fill
            className="object-contain"
            sizes="100vw"
          />
        </div>
        
        {sortedImages.length > 1 && (
          <div className="flex items-center justify-center gap-4 mt-4">
            <button
              onClick={handlePrevious}
              className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <span className="text-sm font-medium">
              {selectedIndex + 1} / {sortedImages.length}
            </span>
            <button
              onClick={handleNext}
              className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full"
              aria-label="Next image"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ProductGallery;
