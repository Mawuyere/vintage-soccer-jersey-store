import { CreditCard, DollarSign } from 'lucide-react';
import Card from '@/components/ui/Card';
import { cn } from '@/lib/utils/cn';

interface PaymentMethodSelectorProps {
  selectedMethod: 'stripe' | 'paypal' | 'square' | null;
  onSelect: (method: 'stripe' | 'paypal' | 'square') => void;
}

const paymentMethods = [
  {
    id: 'stripe' as const,
    name: 'Credit/Debit Card',
    description: 'Pay securely with Stripe',
    icon: CreditCard,
    badges: ['Visa', 'Mastercard', 'Amex'],
    color: 'blue',
  },
  {
    id: 'paypal' as const,
    name: 'PayPal',
    description: 'Fast and secure PayPal checkout',
    icon: DollarSign,
    badges: ['PayPal'],
    color: 'yellow',
  },
  {
    id: 'square' as const,
    name: 'Square',
    description: 'Pay with Square',
    icon: CreditCard,
    badges: ['All Cards'],
    color: 'green',
  },
];

export default function PaymentMethodSelector({
  selectedMethod,
  onSelect,
}: PaymentMethodSelectorProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
          Payment Method
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Choose how you'd like to pay for your order. All payment methods are secure and encrypted.
        </p>
      </div>

      <div className="space-y-3">
        {paymentMethods.map((method) => {
          const Icon = method.icon;
          const isSelected = selectedMethod === method.id;

          return (
            <button
              key={method.id}
              type="button"
              onClick={() => onSelect(method.id)}
              className={cn(
                'w-full rounded-lg border-2 p-4 text-left transition-all',
                'hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                isSelected
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
              )}
            >
              <div className="flex items-start gap-4">
                {/* Radio Button */}
                <div
                  className={cn(
                    'mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2',
                    isSelected
                      ? 'border-blue-600 bg-blue-600'
                      : 'border-gray-300 dark:border-gray-600'
                  )}
                >
                  {isSelected && (
                    <div className="h-2 w-2 rounded-full bg-white" />
                  )}
                </div>

                {/* Icon */}
                <div
                  className={cn(
                    'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg',
                    method.color === 'blue' && 'bg-blue-100 dark:bg-blue-900/30',
                    method.color === 'yellow' && 'bg-yellow-100 dark:bg-yellow-900/30',
                    method.color === 'green' && 'bg-green-100 dark:bg-green-900/30'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-6 w-6',
                      method.color === 'blue' && 'text-blue-600 dark:text-blue-400',
                      method.color === 'yellow' && 'text-yellow-600 dark:text-yellow-400',
                      method.color === 'green' && 'text-green-600 dark:text-green-400'
                    )}
                  />
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      {method.name}
                    </h3>
                    <div className="flex gap-1">
                      {method.badges.map((badge) => (
                        <span
                          key={badge}
                          className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                        >
                          {badge}
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {method.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <svg
              className="h-5 w-5 text-green-600 dark:text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Secure Payment
            </h4>
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
              Your payment information is encrypted and secure. We never store your card details.
            </p>
          </div>
        </div>
      </div>

      {selectedMethod && (
        <div className="rounded-lg border-2 border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
          <p className="text-sm text-green-800 dark:text-green-200">
            ✓ You will be redirected to complete your payment securely
          </p>
        </div>
      )}
    </div>
  );
}
