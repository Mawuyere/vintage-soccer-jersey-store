'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ProductGrid from '@/components/product/ProductGrid';
import ProductFilter from '@/components/product/ProductFilter';
import SearchBar from '@/components/product/SearchBar';
import { useCart } from '@/lib/hooks/useCart';
import type { Product, ProductFilters } from '@/types';

const DEFAULT_LIMIT = 200;

export default function ProductsPage() {
  const { itemCount, addItem } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ProductFilters>({});
  const [searchQuery, setSearchQuery] = useState('');

  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        limit: DEFAULT_LIMIT.toString(),
        page: '1',
      });

      const response = await fetch(`/api/products?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to load products');
      }

      const data = await response.json();
      setProducts(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const availableTeams = useMemo(() => {
    const teams = new Set(products.map((product) => product.team).filter(Boolean));
    return Array.from(teams).sort();
  }, [products]);

  const availableYears = useMemo(() => {
    const years = new Set(products.map((product) => product.year).filter(Boolean));
    return Array.from(years).sort().reverse();
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (filters.team && !product.team.toLowerCase().includes(filters.team.toLowerCase())) {
        return false;
      }
      if (filters.year && product.year !== filters.year) {
        return false;
      }
      if (filters.condition && product.condition !== filters.condition) {
        return false;
      }
      if (filters.size && product.size !== filters.size) {
        return false;
      }
      if (filters.minPrice !== undefined && product.price < filters.minPrice) {
        return false;
      }
      if (filters.maxPrice !== undefined && product.price > filters.maxPrice) {
        return false;
      }
      if (searchQuery) {
        const haystack = `${product.name} ${product.team} ${product.year} ${product.description}`.toLowerCase();
        if (!haystack.includes(searchQuery.toLowerCase())) {
          return false;
        }
      }
      return true;
    });
  }, [products, filters, searchQuery]);

  const handleAddToCart = useCallback(
    async (productId: number) => {
      await addItem(productId, 1);
    },
    [addItem]
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header cartItemCount={itemCount} />

      <main className="flex-1">
        <section className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="max-w-3xl">
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900">
                All Products
              </h1>
              <p className="mt-4 text-lg text-gray-600">
                Browse our complete collection of vintage soccer jerseys.
              </p>
              <div className="mt-8 max-w-xl">
                <SearchBar onSearch={setSearchQuery} />
              </div>
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-10">
              <ProductFilter
                filters={filters}
                onFiltersChange={setFilters}
                availableTeams={availableTeams}
                availableYears={availableYears}
              />

              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900">Results</h2>
                    <p className="text-sm text-gray-600">
                      Showing {filteredProducts.length} of {products.length} items
                    </p>
                  </div>
                </div>

                <ProductGrid
                  products={filteredProducts}
                  isLoading={isLoading}
                  error={error}
                  onAddToCart={handleAddToCart}
                  columns={3}
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
