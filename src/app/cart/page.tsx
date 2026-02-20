'use client';

import Link from 'next/link';
import { useCart } from '@/lib/hooks/useCart';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui';

export default function CartPage() {
  const { items, itemCount, subtotal, isLoading } = useCart();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header cartItemCount={itemCount} />

      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-gray-600">Loading...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-gray-600 mb-4">Your cart is empty</p>
            <Link href="/">
              <Button>Continue Shopping</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 border-b border-gray-200 flex gap-4"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        {item.product?.name || 'Product'}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        ${((item.product?.price || 0) * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 h-fit">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Order Summary
              </h2>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping:</span>
                  <span>$0.00</span>
                </div>
              </div>
              <div className="border-t border-gray-200 pt-4 mb-6">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
              </div>
              <Button className="w-full mb-3">Checkout</Button>
              <Link href="/">
                <Button variant="secondary" className="w-full">
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
