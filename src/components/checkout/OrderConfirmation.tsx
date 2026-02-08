import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Package, Mail, ArrowRight, Home } from 'lucide-react';
import { Order } from '@/types';
import Button from '@/components/ui/Button';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface OrderConfirmationProps {
  orderId: number;
}

export default function OrderConfirmation({ orderId }: OrderConfirmationProps) {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/orders/${orderId}`);
        
        if (!response.ok) {
          throw new Error('Failed to load order details');
        }

        const data = await response.json();
        setOrder(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load order');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !order) {
    return (
      <Card variant="bordered" padding="lg">
        <div className="text-center">
          <p className="mb-4 text-red-600 dark:text-red-400">
            {error || 'Order not found'}
          </p>
          <Link href="/orders">
            <Button variant="primary">View My Orders</Button>
          </Link>
        </div>
      </Card>
    );
  }

  const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Success Header */}
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
          </div>
        </div>
        <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
          Order Confirmed!
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Thank you for your purchase
        </p>
      </div>

      {/* Order Details Card */}
      <Card variant="bordered" padding="lg">
        <div className="space-y-6">
          {/* Order Number and Date */}
          <div className="flex flex-col items-center justify-between gap-4 border-b border-gray-200 pb-6 sm:flex-row dark:border-gray-700">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Order Number</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                #{order.id.toString().padStart(6, '0')}
              </p>
            </div>
            <div className="text-center sm:text-right">
              <p className="text-sm text-gray-600 dark:text-gray-400">Order Date</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">{orderDate}</p>
            </div>
          </div>

          {/* Order Items */}
          <div>
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
              <Package className="h-5 w-5" />
              Order Items
            </h3>
            <div className="space-y-3">
              {order.items?.map((item) => {
                const product = item.productSnapshot;
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-800"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {product.team} {product.year}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Size: {product.size} · Qty: {item.quantity}
                      </p>
                    </div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      ${item.price.toFixed(2)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Shipping Address */}
          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
              Shipping Address
            </h3>
            <address className="not-italic text-gray-600 dark:text-gray-400">
              <p>{order.shippingAddress.street}</p>
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                {order.shippingAddress.zip}
              </p>
              <p>{order.shippingAddress.country}</p>
            </address>
          </div>

          {/* Total */}
          <div className="flex justify-between border-t border-gray-200 pt-4 dark:border-gray-700">
            <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Total
            </span>
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              ${order.totalPrice.toFixed(2)}
            </span>
          </div>
        </div>
      </Card>

      {/* What's Next */}
      <Card variant="bordered" padding="lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            What's Next?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                1
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                  Confirmation Email
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  You'll receive an order confirmation email shortly with your order details.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                2
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                  Processing
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  We'll prepare your order for shipment within 1-2 business days.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                3
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                  Shipping Updates
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  You'll receive tracking information once your order ships.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link href={`/orders/${order.id}`}>
          <Button variant="primary" size="lg" className="group">
            View Order Details
            <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Button>
        </Link>
        
        <Link href="/">
          <Button variant="outline" size="lg">
            <Home className="mr-2 h-5 w-5" />
            Back to Home
          </Button>
        </Link>
      </div>

      {/* Support */}
      <div className="rounded-lg bg-gray-50 p-6 text-center dark:bg-gray-800">
        <h3 className="mb-2 font-semibold text-gray-900 dark:text-gray-100">
          Need Help?
        </h3>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Our customer support team is here to assist you with any questions.
        </p>
        <Link href="/contact">
          <Button variant="outline" size="sm">Contact Support</Button>
        </Link>
      </div>
    </div>
  );
}
