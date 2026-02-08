import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCart } from '@/lib/hooks/useCart';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ShippingForm from './ShippingForm';
import PaymentMethodSelector from './PaymentMethodSelector';
import OrderReview from './OrderReview';
import { Address } from '@/types';
import { cn } from '@/lib/utils/cn';

type CheckoutStep = 'shipping' | 'payment' | 'review';

interface ShippingFormData {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export default function CheckoutForm() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('shipping');
  const [shippingAddress, setShippingAddress] = useState<ShippingFormData | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal' | 'square' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const steps: { id: CheckoutStep; label: string; number: number }[] = [
    { id: 'shipping', label: 'Shipping', number: 1 },
    { id: 'payment', label: 'Payment', number: 2 },
    { id: 'review', label: 'Review', number: 3 },
  ];

  const currentStepIndex = steps.findIndex(step => step.id === currentStep);

  const handleShippingSubmit = (data: ShippingFormData) => {
    setShippingAddress(data);
    setCurrentStep('payment');
    setError(null);
  };

  const handlePaymentSelect = (method: 'stripe' | 'paypal' | 'square') => {
    setPaymentMethod(method);
  };

  const handlePaymentNext = () => {
    if (!paymentMethod) {
      setError('Please select a payment method');
      return;
    }
    setCurrentStep('review');
    setError(null);
  };

  const handlePlaceOrder = async () => {
    if (!shippingAddress || !paymentMethod) {
      setError('Missing required information');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartItems: items,
          shippingAddress,
          paymentMethod,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to process order');
      }

      const { orderId, paymentUrl } = await response.json();

      if (paymentUrl) {
        window.location.href = paymentUrl;
      } else {
        await clearCart();
        router.push(`/orders/${orderId}/confirmation`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process order');
      setIsProcessing(false);
    }
  };

  const handleBack = () => {
    setError(null);
    if (currentStep === 'payment') {
      setCurrentStep('shipping');
    } else if (currentStep === 'review') {
      setCurrentStep('payment');
    }
  };

  const canProceed = () => {
    if (currentStep === 'shipping') return !!shippingAddress;
    if (currentStep === 'payment') return !!paymentMethod;
    return true;
  };

  return (
    <div className="mx-auto max-w-4xl">
      {/* Progress Steps */}
      <Card variant="bordered" padding="md" className="mb-6">
        <nav aria-label="Progress">
          <ol className="flex items-center justify-between">
            {steps.map((step, index) => {
              const isCompleted = index < currentStepIndex;
              const isCurrent = step.id === currentStep;

              return (
                <li
                  key={step.id}
                  className={cn(
                    'flex flex-1 items-center',
                    index !== steps.length - 1 && 'pr-8 sm:pr-20'
                  )}
                >
                  <div className="flex items-center">
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors',
                        isCompleted && 'border-green-600 bg-green-600',
                        isCurrent && 'border-blue-600 bg-blue-600',
                        !isCompleted && !isCurrent && 'border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800'
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-6 w-6 text-white" />
                      ) : (
                        <span
                          className={cn(
                            'text-sm font-semibold',
                            isCurrent ? 'text-white' : 'text-gray-500 dark:text-gray-400'
                          )}
                        >
                          {step.number}
                        </span>
                      )}
                    </div>
                    <span
                      className={cn(
                        'ml-3 text-sm font-medium',
                        isCurrent && 'text-blue-600 dark:text-blue-400',
                        isCompleted && 'text-green-600 dark:text-green-400',
                        !isCompleted && !isCurrent && 'text-gray-500 dark:text-gray-400'
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                  {index !== steps.length - 1 && (
                    <div
                      className={cn(
                        'ml-4 hidden h-0.5 flex-1 sm:block',
                        isCompleted ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'
                      )}
                    />
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Step Content */}
      <Card variant="bordered" padding="lg">
        {currentStep === 'shipping' && (
          <ShippingForm
            initialData={shippingAddress}
            onSubmit={handleShippingSubmit}
          />
        )}

        {currentStep === 'payment' && (
          <PaymentMethodSelector
            selectedMethod={paymentMethod}
            onSelect={handlePaymentSelect}
          />
        )}

        {currentStep === 'review' && shippingAddress && paymentMethod && (
          <OrderReview
            items={items}
            shippingAddress={shippingAddress}
            paymentMethod={paymentMethod}
            subtotal={subtotal}
          />
        )}
      </Card>

      {/* Navigation Buttons */}
      <div className="mt-6 flex items-center justify-between">
        {currentStepIndex > 0 ? (
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={isProcessing}
          >
            <ChevronLeft className="mr-1 h-5 w-5" />
            Back
          </Button>
        ) : (
          <div />
        )}

        {currentStep === 'review' ? (
          <Button
            variant="primary"
            size="lg"
            onClick={handlePlaceOrder}
            isLoading={isProcessing}
            disabled={!canProceed()}
          >
            Place Order
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={currentStep === 'shipping' ? () => {} : handlePaymentNext}
            disabled={!canProceed()}
            type={currentStep === 'shipping' ? 'submit' : 'button'}
            form={currentStep === 'shipping' ? 'shipping-form' : undefined}
          >
            Next
            <ChevronRight className="ml-1 h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  );
}
