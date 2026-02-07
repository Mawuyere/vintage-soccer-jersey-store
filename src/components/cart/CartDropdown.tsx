import { Fragment, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ShoppingBag, X } from 'lucide-react';
import { useCart } from '@/lib/hooks/useCart';
import Button from '@/components/ui/Button';
import CartItem from './CartItem';
import CartSummary from './CartSummary';
import EmptyCart from './EmptyCart';
import { cn } from '@/lib/utils/cn';

interface CartDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDropdown({ isOpen, onClose }: CartDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { items, subtotal, itemCount, updateQuantity, removeItem, isLoading } = useCart();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
        aria-hidden="true"
      />

      {/* Dropdown Panel */}
      <div
        ref={dropdownRef}
        className={cn(
          'fixed right-0 top-0 z-50 h-full w-full bg-white shadow-xl transition-transform duration-300 dark:bg-gray-900',
          'sm:w-[400px]',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Shopping Cart
            </h2>
            {itemCount > 0 && (
              <span className="ml-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                {itemCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            aria-label="Close cart"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex h-[calc(100%-180px)] flex-col">
          {isLoading ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-1 items-center justify-center p-6">
              <EmptyCart compact onClose={onClose} />
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto px-4 py-2">
                <div className="space-y-1">
                  {items.map((item) => (
                    <CartItem
                      key={item.id}
                      item={item}
                      onUpdateQuantity={updateQuantity}
                      onRemove={removeItem}
                      compact
                    />
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="border-t border-gray-200 p-4 dark:border-gray-700">
                <CartSummary subtotal={subtotal} compact />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-200 p-4 dark:border-gray-700">
            <div className="flex gap-2">
              <Link href="/cart" className="flex-1">
                <Button
                  variant="outline"
                  fullWidth
                  onClick={onClose}
                >
                  View Cart
                </Button>
              </Link>
              <Link href="/checkout" className="flex-1">
                <Button
                  variant="primary"
                  fullWidth
                  onClick={onClose}
                >
                  Checkout
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
