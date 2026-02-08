import Image from 'next/image';
import { MapPin, CreditCard } from 'lucide-react';
import { CartItem } from '@/types';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import CartSummary from '@/components/cart/CartSummary';

interface OrderReviewProps {
  items: CartItem[];
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  paymentMethod: 'stripe' | 'paypal' | 'square';
  subtotal: number;
}

const paymentMethodLabels = {
  stripe: 'Credit/Debit Card (Stripe)',
  paypal: 'PayPal',
  square: 'Square',
};

export default function OrderReview({
  items,
  shippingAddress,
  paymentMethod,
  subtotal,
}: OrderReviewProps) {
  const shippingCost = subtotal >= 100 ? 0 : 9.99;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
          Review Your Order
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Please review your order details before completing your purchase.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Order Items */}
          <Card variant="bordered" padding="md">
            <CardHeader>
              <CardTitle className="text-lg">Order Items ({items.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {items.map((item) => {
                  const product = item.product;
                  if (!product) return null;

                  const imageUrl = product.images?.[0]?.imageUrl || '/images/placeholder-jersey.jpg';
                  const itemTotal = product.price * item.quantity;

                  return (
                    <div key={item.id} className="flex gap-3">
                      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                        <Image
                          src={imageUrl}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex flex-1 flex-col justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">
                            {product.team} {product.year}
                          </h4>
                          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            Size: {product.size} · {product.condition}
                          </p>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Qty: {item.quantity}
                          </span>
                          <span className="font-semibold text-gray-900 dark:text-gray-100">
                            ${itemTotal.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card variant="bordered" padding="md">
            <CardHeader>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <CardTitle className="text-lg">Shipping Address</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <address className="not-italic text-gray-700 dark:text-gray-300">
                <p className="font-medium">{shippingAddress.street}</p>
                <p>
                  {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zip}
                </p>
                <p>{shippingAddress.country}</p>
              </address>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card variant="bordered" padding="md">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <CardTitle className="text-lg">Payment Method</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300">
                {paymentMethodLabels[paymentMethod]}
              </p>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                You will be redirected to complete payment securely
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Order Summary */}
        <div>
          <CartSummary
            subtotal={subtotal}
            shippingCost={shippingCost}
          />

          <div className="mt-6 rounded-lg border-2 border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
            <h3 className="mb-2 font-semibold text-blue-900 dark:text-blue-100">
              📝 Before you proceed:
            </h3>
            <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
              <li>• Review all order details carefully</li>
              <li>• Ensure shipping address is correct</li>
              <li>• You'll receive an order confirmation email</li>
              <li>• Estimated delivery: 5-7 business days</li>
            </ul>
          </div>

          <div className="mt-4 rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-200 dark:bg-green-800">
                <svg
                  className="h-5 w-5 text-green-700 dark:text-green-200"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-green-900 dark:text-green-100">
                  30-Day Return Policy
                </h4>
                <p className="mt-1 text-xs text-green-800 dark:text-green-200">
                  Not satisfied? Return within 30 days for a full refund.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
