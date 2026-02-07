# Product Components

This directory contains all product-related components for the Vintage Soccer Jersey Store e-commerce application.

## Components

### ProductCard
A card component for displaying products in a grid layout.

**Features:**
- Product image with hover effect
- Featured and condition badges
- Price and size display
- Add to cart button
- Favorite button
- Out of stock overlay
- Responsive design

**Props:**
- `product: Product` - Product data
- `onAddToCart?: (productId: number) => void` - Add to cart handler
- `isLoading?: boolean` - Loading state
- `className?: string` - Additional CSS classes

**Usage:**
```tsx
<ProductCard 
  product={product} 
  onAddToCart={handleAddToCart}
/>
```

### ProductGrid
Grid layout component for displaying multiple ProductCards.

**Features:**
- Responsive grid (2, 3, or 4 columns)
- Loading state with spinner
- Error state with message
- Empty state with icon and message
- Configurable columns

**Props:**
- `products: Product[]` - Array of products
- `isLoading?: boolean` - Loading state
- `error?: string | null` - Error message
- `onAddToCart?: (productId: number) => void` - Add to cart handler
- `emptyMessage?: string` - Custom empty message
- `className?: string` - Additional CSS classes
- `columns?: 2 | 3 | 4` - Number of columns (default: 3)

**Usage:**
```tsx
<ProductGrid 
  products={products}
  isLoading={isLoading}
  error={error}
  onAddToCart={handleAddToCart}
  columns={3}
/>
```

### ProductGallery
Image gallery component with thumbnails and full-size modal view.

**Features:**
- Main image display
- Thumbnail navigation
- Previous/Next arrows
- Image counter
- Full-size modal view
- Keyboard navigation (arrow keys)
- Responsive design

**Props:**
- `images: ProductImage[]` - Array of product images
- `productName: string` - Product name for alt text
- `className?: string` - Additional CSS classes

**Usage:**
```tsx
<ProductGallery 
  images={product.images}
  productName={product.name}
/>
```

### ProductDetails
Comprehensive product details component for product pages.

**Features:**
- Product name, team, and year
- Price display
- Condition badge and description
- Quantity selector
- Add to cart button
- Favorite button
- Share button
- Size, SKU, and shipping info
- Product description
- Responsive design

**Props:**
- `product: Product` - Product data
- `onAddToCart?: (productId: number, quantity: number) => Promise<void>` - Add to cart handler
- `className?: string` - Additional CSS classes

**Usage:**
```tsx
<ProductDetails 
  product={product}
  onAddToCart={handleAddToCart}
/>
```

### ProductFilter
Filter sidebar/panel for filtering products.

**Features:**
- Team filter
- Year filter
- Condition filter
- Size filter
- Price range filter (min/max)
- Active filters count badge
- Clear all filters
- Apply filters button
- Mobile responsive with slide-in panel

**Props:**
- `filters: ProductFilters` - Current filter values
- `onFiltersChange: (filters: ProductFilters) => void` - Filter change handler
- `availableTeams?: string[]` - Array of available teams
- `availableYears?: string[]` - Array of available years
- `className?: string` - Additional CSS classes
- `isMobile?: boolean` - Mobile mode flag
- `isOpen?: boolean` - Open state (for mobile)
- `onClose?: () => void` - Close handler (for mobile)

**Usage:**
```tsx
<ProductFilter 
  filters={filters}
  onFiltersChange={handleFiltersChange}
  availableTeams={teams}
  availableYears={years}
/>
```

### SearchBar
Search input component with debounced real-time search.

**Features:**
- Search icon
- Debounced input (configurable delay)
- Clear button
- Loading indicator
- Search results indicator
- Keyboard support (Escape to clear)
- Auto-focus option

**Props:**
- `onSearch: (query: string) => void` - Search handler
- `placeholder?: string` - Placeholder text
- `debounceMs?: number` - Debounce delay in milliseconds (default: 300)
- `className?: string` - Additional CSS classes
- `autoFocus?: boolean` - Auto-focus flag
- `initialValue?: string` - Initial search value

**Usage:**
```tsx
<SearchBar 
  onSearch={handleSearch}
  placeholder="Search jerseys..."
  debounceMs={300}
/>
```

### FeaturedProducts
Featured products carousel/grid component.

**Features:**
- Carousel with auto-play
- Previous/Next navigation
- Dot indicators
- Mobile responsive
- Auto-play control
- Grid view for small product counts
- Loading and error states

**Props:**
- `products?: Product[]` - Array of featured products
- `isLoading?: boolean` - Loading state
- `error?: string | null` - Error message
- `onAddToCart?: (productId: number) => void` - Add to cart handler
- `title?: string` - Section title (default: "Featured Products")
- `showControls?: boolean` - Show navigation controls (default: true)
- `autoPlay?: boolean` - Auto-play carousel (default: true)
- `autoPlayInterval?: number` - Auto-play interval in ms (default: 5000)
- `className?: string` - Additional CSS classes

**Usage:**
```tsx
<FeaturedProducts 
  products={featuredProducts}
  onAddToCart={handleAddToCart}
  autoPlay={true}
  autoPlayInterval={5000}
/>
```

## Example: Complete Product Browsing Experience

Here's how to combine these components for a full product browsing experience:

```tsx
'use client';

import { useState, useCallback } from 'react';
import {
  ProductGrid,
  ProductFilter,
  SearchBar,
  FeaturedProducts,
} from '@/components/product';
import { Product, ProductFilters } from '@/types';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filters, setFilters] = useState<ProductFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    // Fetch products with search query
  }, []);

  const handleFiltersChange = useCallback((newFilters: ProductFilters) => {
    setFilters(newFilters);
    // Fetch products with filters
  }, []);

  const handleAddToCart = async (productId: number) => {
    // Add to cart logic
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Featured Products Section */}
      <FeaturedProducts 
        products={featuredProducts}
        onAddToCart={handleAddToCart}
      />

      {/* Search and Filters */}
      <div className="flex gap-6 mt-12">
        <aside className="w-64 flex-shrink-0">
          <ProductFilter 
            filters={filters}
            onFiltersChange={handleFiltersChange}
            availableTeams={teams}
            availableYears={years}
          />
        </aside>

        <main className="flex-1">
          <SearchBar 
            onSearch={handleSearch}
            placeholder="Search vintage jerseys..."
          />

          <ProductGrid 
            products={products}
            isLoading={isLoading}
            error={error}
            onAddToCart={handleAddToCart}
            columns={3}
          />
        </main>
      </div>
    </div>
  );
}
```

## Example: Product Detail Page

```tsx
'use client';

import { ProductGallery, ProductDetails } from '@/components/product';
import { Product } from '@/types';

export default function ProductPage({ product }: { product: Product }) {
  const handleAddToCart = async (productId: number, quantity: number) => {
    // Add to cart logic
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ProductGallery 
          images={product.images || []}
          productName={product.name}
        />
        
        <ProductDetails 
          product={product}
          onAddToCart={handleAddToCart}
        />
      </div>
    </div>
  );
}
```

## Dependencies

All components use:
- **React 19** with hooks
- **Next.js 16** (App Router)
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **UI components** from `@/components/ui`
- **Types** from `@/types`

## Accessibility Features

All components include:
- Proper ARIA labels and roles
- Keyboard navigation support
- Focus management
- Screen reader friendly
- Semantic HTML
- Color contrast compliance

## Mobile Responsive

All components are fully responsive and include:
- Mobile-first design
- Touch-friendly interactions
- Adaptive layouts
- Optimized images
- Smooth transitions

## Performance

Components are optimized for performance:
- Code splitting ready
- Image optimization with Next.js Image
- Debounced search
- Lazy loading support
- Minimal re-renders
- Memoization where appropriate
