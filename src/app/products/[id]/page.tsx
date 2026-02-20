'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button, LoadingSpinner, ErrorMessage } from '@/components/ui';
import type { Product } from '@/types';

export default function ProductDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { id } = (params as unknown as { id: string });

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/products/${id}`);
        if (!response.ok) throw new Error('Product not found');
        const data = await response.json();
        setProduct(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load product');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header cartItemCount={0} />

      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <div className="py-12">
            <ErrorMessage message={error} />
            <Link href="/" className="mt-4 inline-block">
              <Button>Back to Home</Button>
            </Link>
          </div>
        ) : product ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg p-4">
              <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                <p className="text-gray-400">Product Image</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {product.name}
                </h1>
                <p className="text-lg text-gray-600 mt-2">
                  {product.team} - {product.year}
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Price</p>
                  <p className="text-3xl font-bold text-gray-900">
                    ${(typeof product.price === 'number' ? product.price : Number(product.price)).toFixed(2)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Condition</p>
                    <p className="font-medium text-gray-900">{product.condition}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Size</p>
                    <p className="font-medium text-gray-900">{product.size}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">SKU</p>
                    <p className="font-medium text-gray-900">{product.sku}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Stock</p>
                    <p className="font-medium text-gray-900">
                      {product.inventory > 0 ? `${product.inventory} available` : 'Out of stock'}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2">Description</p>
                  <p className="text-gray-900">{product.description}</p>
                </div>

                <Button
                  className="w-full"
                  disabled={product.inventory === 0}
                >
                  {product.inventory === 0 ? 'Out of Stock' : 'Add to Cart'}
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </main>

      <Footer />
    </div>
  );
}
