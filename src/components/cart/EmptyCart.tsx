import Link from 'next/link';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import Button from '@/components/ui/Button';

interface EmptyCartProps {
  compact?: boolean;
  onClose?: () => void;
}

export default function EmptyCart({ compact = false, onClose }: EmptyCartProps) {
  if (compact) {
    return (
      <div className="flex flex-col items-center py-8 text-center">
        <div className="mb-4 rounded-full bg-gray-100 p-4 dark:bg-gray-800">
          <ShoppingBag className="h-12 w-12 text-gray-400" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
          Your cart is empty
        </h3>
        <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
          Start shopping to add items to your cart
        </p>
        <Link href="/products">
          <Button
            variant="primary"
            size="sm"
            onClick={onClose}
          >
            Browse Jerseys
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-6 rounded-full bg-gray-100 p-8 dark:bg-gray-800">
        <ShoppingBag className="h-20 w-20 text-gray-400" strokeWidth={1.5} />
      </div>
      
      <h2 className="mb-3 text-2xl font-bold text-gray-900 dark:text-gray-100">
        Your cart is empty
      </h2>
      
      <p className="mb-8 max-w-md text-gray-600 dark:text-gray-400">
        Looks like you haven't added any vintage soccer jerseys to your cart yet. 
        Explore our collection and find your perfect match!
      </p>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/products">
          <Button
            variant="primary"
            size="lg"
            className="group"
          >
            Browse Collection
            <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Button>
        </Link>
        
        <Link href="/products?featured=true">
          <Button
            variant="outline"
            size="lg"
          >
            View Featured
          </Button>
        </Link>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-3">
        <div className="text-center">
          <div className="mb-2 text-3xl">🏆</div>
          <h4 className="mb-1 font-semibold text-gray-900 dark:text-gray-100">
            Authentic Jerseys
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            100% genuine vintage pieces
          </p>
        </div>
        
        <div className="text-center">
          <div className="mb-2 text-3xl">🚚</div>
          <h4 className="mb-1 font-semibold text-gray-900 dark:text-gray-100">
            Free Shipping
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            On orders over $100
          </p>
        </div>
        
        <div className="text-center">
          <div className="mb-2 text-3xl">💯</div>
          <h4 className="mb-1 font-semibold text-gray-900 dark:text-gray-100">
            Easy Returns
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            30-day return policy
          </p>
        </div>
      </div>
    </div>
  );
}
