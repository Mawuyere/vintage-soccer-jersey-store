# Component Examples and Usage Guide

This guide provides comprehensive examples of how to use the UI and layout components.

## Basic Example Page

```tsx
import {
  Button,
  Input,
  Select,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Badge,
  LoadingSpinner,
  ErrorMessage,
  Modal,
} from '@/components/ui';
import { Header, Footer } from '@/components/layout';

export default function ExamplePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <>
      <Header cartItemCount={3} isAuthenticated={true} userName="John Doe" />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section with Buttons */}
        <section className="mb-12">
          <h1 className="text-4xl font-bold mb-6">Welcome to Vintage Jerseys</h1>
          <div className="flex gap-4 flex-wrap">
            <Button variant="primary" size="lg">
              Shop Now
            </Button>
            <Button variant="outline" size="lg">
              Learn More
            </Button>
            <Button variant="secondary" size="lg">
              Contact Us
            </Button>
          </div>
        </section>

        {/* Form Example */}
        <section className="mb-12">
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Contact Form</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <Input
                  label="Name"
                  placeholder="Enter your name"
                  required
                />
                <Input
                  label="Email"
                  type="email"
                  placeholder="your@email.com"
                  required
                />
                <Select
                  label="Country"
                  options={[
                    { value: 'us', label: 'United States' },
                    { value: 'uk', label: 'United Kingdom' },
                    { value: 'de', label: 'Germany' },
                  ]}
                  placeholder="Select your country"
                />
                <Input
                  label="Message"
                  placeholder="Your message"
                />
              </form>
            </CardContent>
            <CardFooter>
              <Button variant="primary" isLoading={isLoading}>
                Submit
              </Button>
            </CardFooter>
          </Card>
        </section>

        {/* Product Cards with Badges */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Featured Products</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((item) => (
              <Card key={item} variant="bordered">
                <CardContent className="p-0">
                  <div className="aspect-square bg-gray-200 rounded-t-lg" />
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">Vintage Jersey {item}</h3>
                      <Badge variant="success">In Stock</Badge>
                    </div>
                    <p className="text-gray-600 mb-4">
                      Classic design from the 90s
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold">$49.99</span>
                      <Button size="sm">Add to Cart</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="xl" label="Loading products..." />
          </div>
        )}

        {/* Error Message Example */}
        <section className="mb-12">
          <ErrorMessage
            title="Oops! Something went wrong"
            message="We couldn't load your cart. Please try again."
            variant="banner"
            onDismiss={() => console.log('Error dismissed')}
          />
        </section>

        {/* Modal Example */}
        <section className="mb-12">
          <Button onClick={() => setIsModalOpen(true)}>
            Open Modal
          </Button>
          
          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="Confirm Purchase"
            description="Review your order before completing the purchase"
            size="md"
          >
            <div className="space-y-4">
              <p>Are you sure you want to purchase this item?</p>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    // Handle purchase
                    setIsModalOpen(false);
                  }}
                >
                  Confirm
                </Button>
              </div>
            </div>
          </Modal>
        </section>

        {/* Badge Variants */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Status Badges</h2>
          <div className="flex gap-3 flex-wrap">
            <Badge variant="default">Default</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="danger">Danger</Badge>
            <Badge variant="info">Info</Badge>
            <Badge variant="secondary">Secondary</Badge>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
```

## Advanced Patterns

### Form with Validation

```tsx
'use client';

import { useState } from 'react';
import { Input, Button, ErrorMessage } from '@/components/ui';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    
    if (!email) newErrors.email = 'Email is required';
    if (!password) newErrors.password = 'Password is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      // Submit form
    } catch (error) {
      setSubmitError('Login failed. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {submitError && (
        <ErrorMessage
          message={submitError}
          onDismiss={() => setSubmitError('')}
        />
      )}
      
      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
        required
      />
      
      <Input
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
        required
      />
      
      <Button type="submit" fullWidth>
        Log In
      </Button>
    </form>
  );
}
```

### Shopping Cart Modal

```tsx
'use client';

import { Modal, Button, Badge, Card } from '@/components/ui';

export function CartModal({ isOpen, onClose, items }) {
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Shopping Cart"
      size="lg"
    >
      <div className="space-y-4">
        {items.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            Your cart is empty
          </p>
        ) : (
          <>
            {items.map((item) => (
              <Card key={item.id} variant="bordered" padding="sm">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 bg-gray-200 rounded" />
                  <div className="flex-1">
                    <h4 className="font-semibold">{item.name}</h4>
                    <p className="text-sm text-gray-600">
                      Qty: {item.quantity}
                    </p>
                  </div>
                  <Badge variant="info">${item.price}</Badge>
                </div>
              </Card>
            ))}
            
            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-4">
                <span className="font-semibold">Total:</span>
                <span className="text-2xl font-bold">${total.toFixed(2)}</span>
              </div>
              
              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose} fullWidth>
                  Continue Shopping
                </Button>
                <Button variant="primary" fullWidth>
                  Checkout
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
```

### Dashboard with Cards

```tsx
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui';

export function Dashboard({ stats }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="text-lg">Total Sales</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">${stats.sales}</p>
          <Badge variant="success" size="sm">+12%</Badge>
        </CardContent>
      </Card>
      
      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="text-lg">Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{stats.orders}</p>
          <Badge variant="info" size="sm">+5%</Badge>
        </CardContent>
      </Card>
      
      {/* More cards... */}
    </div>
  );
}
```

## Best Practices

1. **Always use the cn utility for className merging**
   ```tsx
   import { cn } from '@/lib/utils/cn';
   
   <Button className={cn('my-custom-class', someCondition && 'conditional-class')}>
     Click me
   </Button>
   ```

2. **Use proper TypeScript types**
   ```tsx
   import { ButtonProps } from '@/components/ui';
   
   const CustomButton: React.FC<ButtonProps> = (props) => {
     return <Button {...props} />;
   };
   ```

3. **Leverage composition for complex UIs**
   ```tsx
   <Card>
     <CardHeader>
       <CardTitle>Title</CardTitle>
       <CardDescription>Description</CardDescription>
     </CardHeader>
     <CardContent>
       {/* Content */}
     </CardContent>
     <CardFooter>
       {/* Actions */}
     </CardFooter>
   </Card>
   ```

4. **Always provide accessible labels**
   ```tsx
   <Input label="Email" id="email" aria-required="true" />
   <Button aria-label="Close modal">×</Button>
   ```
