import { useState } from 'react';
import Image from 'next/image';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { CartItem as CartItemType } from '@/types';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils/cn';

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (itemId: number, quantity: number) => Promise<void>;
  onRemove: (itemId: number) => Promise<void>;
  compact?: boolean;
}

export default function CartItem({
  item,
  onUpdateQuantity,
  onRemove,
  compact = false,
}: CartItemProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const product = item.product;
  
  if (!product) {
    return null;
  }

  const imageUrl = product.images?.[0]?.imageUrl || '/images/placeholder-jersey.jpg';
  const itemTotal = product.price * item.quantity;

  const handleQuantityChange = async (newQuantity: number) => {
    if (isUpdating || newQuantity < 0) return;
    
    try {
      setIsUpdating(true);
      await onUpdateQuantity(item.id, newQuantity);
    } catch (error) {
      console.error('Failed to update quantity:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async () => {
    if (isRemoving) return;
    
    try {
      setIsRemoving(true);
      await onRemove(item.id);
    } catch (error) {
      console.error('Failed to remove item:', error);
      setIsRemoving(false);
    }
  };

  if (compact) {
    return (
      <div className="flex gap-3 py-3">
        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover"
          />
        </div>
        
        <div className="flex flex-1 flex-col justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {product.team} {product.year}
            </h4>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Size: {product.size} · {product.condition}
            </p>
          </div>
          
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              ${product.price.toFixed(2)} × {item.quantity}
            </p>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              ${itemTotal.toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-4 border-b border-gray-200 py-6 dark:border-gray-700">
      <div className="relative h-28 w-28 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 sm:h-32 sm:w-32">
        <Image
          src={imageUrl}
          alt={product.name}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 112px, 128px"
        />
      </div>

      <div className="flex flex-1 flex-col">
        <div className="flex justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {product.team}
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Season: {product.year}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                Size: {product.size}
              </span>
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                {product.condition}
              </span>
            </div>
          </div>

          <div className="ml-4 text-right">
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
              ${itemTotal.toFixed(2)}
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              ${product.price.toFixed(2)} each
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700 dark:text-gray-300">Quantity:</span>
            <div className="flex items-center rounded-lg border border-gray-300 dark:border-gray-600">
              <button
                onClick={() => handleQuantityChange(item.quantity - 1)}
                disabled={isUpdating || item.quantity <= 1}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-l-lg transition-colors',
                  'hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50',
                  'dark:hover:bg-gray-700'
                )}
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </button>
              
              <span className="flex h-8 w-12 items-center justify-center text-sm font-medium">
                {item.quantity}
              </span>
              
              <button
                onClick={() => handleQuantityChange(item.quantity + 1)}
                disabled={isUpdating || item.quantity >= product.inventory}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-r-lg transition-colors',
                  'hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50',
                  'dark:hover:bg-gray-700'
                )}
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            
            {product.inventory <= 5 && (
              <span className="text-xs text-orange-600 dark:text-orange-400">
                Only {product.inventory} left
              </span>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={isRemoving}
            className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            <Trash2 className="mr-1 h-4 w-4" />
            Remove
          </Button>
        </div>
      </div>
    </div>
  );
}
