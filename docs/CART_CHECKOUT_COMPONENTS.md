# Shopping Cart and Checkout Components

This directory contains comprehensive shopping cart and checkout functionality for the vintage soccer jersey e-commerce platform.

## Components Overview

### Cart Components (`src/components/cart/`)

#### 1. CartItem.tsx
Individual cart item component displaying jersey details with quantity controls.

**Features:**
- Product image, team name, year, size, and condition
- Quantity increment/decrement buttons
- Remove item button with confirmation
- Item subtotal calculation
- Low inventory warning
- Optimistic updates with loading states
- Compact and full display modes

**Props:**
```typescript
interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (itemId: number, quantity: number) => Promise<void>;
  onRemove: (itemId: number) => Promise<void>;
  compact?: boolean; // Default: false
}
```

#### 2. CartSummary.tsx
Order summary component showing pricing breakdown.

**Features:**
- Subtotal, shipping, tax, and discount display
- Total calculation
- Free shipping threshold notification ($100+)
- Tooltips for pricing information
- Compact and full display modes

**Props:**
```typescript
interface CartSummaryProps {
  subtotal: number;
  shippingCost?: number;    // Default: 0
  taxRate?: number;         // Default: 0.08 (8%)
  discountAmount?: number;  // Default: 0
  compact?: boolean;        // Default: false
}
```

#### 3. CartDropdown.tsx
Slide-out mini cart panel accessible from the header.

**Features:**
- Slide animation from right side
- Backdrop with blur effect
- Click outside to close
- ESC key to close
- Cart item count badge
- Quick access to full cart and checkout
- Compact cart items display
- Empty cart state

**Props:**
```typescript
interface CartDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}
```

#### 4. EmptyCart.tsx
Empty cart state with promotional content.

**Features:**
- Large empty cart icon
- Call-to-action buttons
- Feature highlights (authenticity, free shipping, returns)
- Browse and featured products links
- Compact and full display modes

**Props:**
```typescript
interface EmptyCartProps {
  compact?: boolean;  // Default: false
  onClose?: () => void;
}
```

### Checkout Components (`src/components/checkout/`)

#### 5. CheckoutForm.tsx
Multi-step checkout orchestrator managing the complete checkout flow.

**Features:**
- 3-step progress indicator
- Step validation before proceeding
- Form state management across steps
- Error handling and display
- Back navigation between steps
- Order submission and payment redirect

**Steps:**
1. Shipping information
2. Payment method selection
3. Order review and confirmation

#### 6. ShippingForm.tsx
Shipping address form with validation.

**Features:**
- Street, city, state, ZIP, and country fields
- Form validation using react-hook-form and zod
- US states dropdown (all 50 states)
- Country selection (US, CA, GB, AU)
- Shipping information display
- Error messages for invalid inputs

**Validation Schema:**
```typescript
{
  street: min 5 characters
  city: min 2 characters
  state: min 2 characters
  zip: US format (12345 or 12345-6789)
  country: min 2 characters
}
```

#### 7. PaymentMethodSelector.tsx
Payment method selection interface.

**Features:**
- Three payment options: Stripe, PayPal, Square
- Visual card-based selection
- Radio button selection
- Badge display for accepted cards
- Security information display
- Redirect notification

**Props:**
```typescript
interface PaymentMethodSelectorProps {
  selectedMethod: 'stripe' | 'paypal' | 'square' | null;
  onSelect: (method: 'stripe' | 'paypal' | 'square') => void;
}
```

#### 8. OrderReview.tsx
Final order review before payment processing.

**Features:**
- Complete cart items list with images
- Shipping address display
- Payment method display
- Full pricing summary
- Pre-checkout checklist
- Return policy information

**Props:**
```typescript
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
```

#### 9. OrderConfirmation.tsx
Post-purchase confirmation page.

**Features:**
- Order confirmation with success icon
- Order number and date display
- Complete order details
- Shipping address confirmation
- What's next timeline (3 steps)
- Order tracking link
- Customer support access

**Props:**
```typescript
interface OrderConfirmationProps {
  orderId: number;
}
```

### Custom Hook (`src/lib/hooks/`)

#### useCart.ts
Custom React hook for cart state management.

**Features:**
- Fetch cart items from API
- Add item to cart
- Remove item from cart
- Update item quantity
- Clear entire cart
- Cart item count calculation
- Subtotal calculation
- Optimistic updates
- Error handling
- Loading states

**API:**
```typescript
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
```

**Usage:**
```typescript
import { useCart } from '@/lib/hooks/useCart';

function MyComponent() {
  const {
    items,
    itemCount,
    subtotal,
    isLoading,
    error,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
  } = useCart();
  
  // Use cart state and methods
}
```

## API Endpoints Required

The components expect these API endpoints to be implemented:

### Cart Endpoints
- `GET /api/cart` - Fetch user's cart items
- `POST /api/cart` - Add item to cart
  ```json
  { "productId": 1, "quantity": 1 }
  ```
- `PATCH /api/cart/:itemId` - Update item quantity
  ```json
  { "quantity": 2 }
  ```
- `DELETE /api/cart/:itemId` - Remove item from cart
- `DELETE /api/cart` - Clear entire cart

### Checkout Endpoints
- `POST /api/checkout` - Process checkout
  ```json
  {
    "cartItems": [...],
    "shippingAddress": {...},
    "paymentMethod": "stripe"
  }
  ```
  Response:
  ```json
  {
    "orderId": 123,
    "paymentUrl": "https://..."
  }
  ```

### Order Endpoints
- `GET /api/orders/:orderId` - Get order details

## Usage Examples

### 1. Adding Cart to Header
```typescript
import { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/lib/hooks/useCart';
import CartDropdown from '@/components/cart/CartDropdown';

function Header() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { itemCount } = useCart();

  return (
    <header>
      <button onClick={() => setIsCartOpen(true)}>
        <ShoppingCart />
        {itemCount > 0 && <span>{itemCount}</span>}
      </button>
      
      <CartDropdown
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />
    </header>
  );
}
```

### 2. Full Cart Page
```typescript
import { useCart } from '@/lib/hooks/useCart';
import CartItem from '@/components/cart/CartItem';
import CartSummary from '@/components/cart/CartSummary';
import EmptyCart from '@/components/cart/EmptyCart';

function CartPage() {
  const {
    items,
    subtotal,
    isLoading,
    updateQuantity,
    removeItem,
  } = useCart();

  if (items.length === 0) {
    return <EmptyCart />;
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        {items.map(item => (
          <CartItem
            key={item.id}
            item={item}
            onUpdateQuantity={updateQuantity}
            onRemove={removeItem}
          />
        ))}
      </div>
      <CartSummary subtotal={subtotal} />
    </div>
  );
}
```

### 3. Checkout Page
```typescript
import CheckoutForm from '@/components/checkout/CheckoutForm';

function CheckoutPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>
      <CheckoutForm />
    </div>
  );
}
```

### 4. Order Confirmation Page
```typescript
import { useParams } from 'next/navigation';
import OrderConfirmation from '@/components/checkout/OrderConfirmation';

function OrderConfirmationPage() {
  const { orderId } = useParams();

  return (
    <div className="container mx-auto px-4 py-8">
      <OrderConfirmation orderId={Number(orderId)} />
    </div>
  );
}
```

## Styling

All components use Tailwind CSS with these key features:
- Responsive design (mobile-first approach)
- Dark mode support
- Smooth transitions and animations
- Consistent spacing and typography
- Accessible color contrasts

## Accessibility

Components include:
- ARIA labels and roles
- Keyboard navigation support
- Focus management
- Screen reader friendly
- Semantic HTML structure
- Error message announcements

## Best Practices

1. **State Management**: Use the `useCart` hook for all cart operations
2. **Optimistic Updates**: UI updates immediately before API calls complete
3. **Error Handling**: All API errors are caught and displayed to users
4. **Loading States**: Show spinners during async operations
5. **Validation**: Forms validate on submit and show inline errors
6. **Responsive**: All components work on mobile, tablet, and desktop
7. **Type Safety**: Full TypeScript support with proper types

## Testing Recommendations

1. Test cart operations (add, remove, update quantity)
2. Test checkout flow from start to finish
3. Test form validation (invalid inputs)
4. Test error handling (API failures)
5. Test responsive design at different screen sizes
6. Test keyboard navigation
7. Test with screen readers
8. Test payment method selection
9. Test order confirmation display

## Future Enhancements

- [ ] Add promo code/discount code input
- [ ] Add gift wrapping option
- [ ] Add order notes field
- [ ] Add saved addresses management
- [ ] Add express checkout (1-click)
- [ ] Add estimated delivery date calculation
- [ ] Add international shipping support
- [ ] Add multiple shipping methods
- [ ] Add save cart for later
- [ ] Add cart sharing via link
