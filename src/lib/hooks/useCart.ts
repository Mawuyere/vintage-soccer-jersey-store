import { useState, useEffect, useCallback } from 'react';
import { CartItem, Product } from '@/types';

interface CartState {
  items: CartItem[];
  isLoading: boolean;
  error: string | null;
}

interface UseCartReturn {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  isLoading: boolean;
  error: string | null;
  addItem: (productId: number, quantity?: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  updateQuantity: (itemId: number, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

export function useCart(): UseCartReturn {
  const [state, setState] = useState<CartState>({
    items: [],
    isLoading: true,
    error: null,
  });

  const fetchCart = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const response = await fetch('/api/cart');
      
      if (!response.ok) {
        throw new Error('Failed to fetch cart');
      }

      const data = await response.json();
      setState({
        items: data.items || [],
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load cart',
      }));
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addItem = useCallback(async (productId: number, quantity: number = 1) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please log in to add items to your cart');
        }
        try {
          const error = await response.json();
          throw new Error(error.message || 'Failed to add item to cart');
        } catch {
          throw new Error('Failed to add item to cart');
        }
      }

      await fetchCart();
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to add item',
      }));
      throw error;
    }
  }, [fetchCart]);

  const removeItem = useCallback(async (itemId: number) => {
    const previousItems = state.items;
    
    setState(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId),
    }));

    try {
      const response = await fetch(`/api/cart/${itemId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove item from cart');
      }
    } catch (error) {
      setState(prev => ({ ...prev, items: previousItems }));
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to remove item',
      }));
      throw error;
    }
  }, [state.items]);

  const updateQuantity = useCallback(async (itemId: number, quantity: number) => {
    if (quantity < 1) {
      await removeItem(itemId);
      return;
    }

    const previousItems = state.items;
    
    setState(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      ),
    }));

    try {
      const response = await fetch(`/api/cart/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
      });

      if (!response.ok) {
        throw new Error('Failed to update quantity');
      }
    } catch (error) {
      setState(prev => ({ ...prev, items: previousItems }));
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to update quantity',
      }));
      throw error;
    }
  }, [state.items, removeItem]);

  const clearCart = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const response = await fetch('/api/cart', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to clear cart');
      }

      setState({
        items: [],
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to clear cart',
      }));
      throw error;
    }
  }, []);

  const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);
  
  const subtotal = state.items.reduce((sum, item) => {
    const price = item.product?.price || 0;
    return sum + (price * item.quantity);
  }, 0);

  return {
    items: state.items,
    itemCount,
    subtotal,
    isLoading: state.isLoading,
    error: state.error,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    refreshCart: fetchCart,
  };
}
