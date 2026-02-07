# UI Components

This directory contains reusable UI components for the Vintage Soccer Jersey Store.

## Components

### Button
Versatile button component with multiple variants and states.

**Variants:** `primary`, `secondary`, `outline`, `danger`, `ghost`  
**Sizes:** `sm`, `md`, `lg`

```tsx
import { Button } from '@/components/ui';

<Button variant="primary" size="md">Click me</Button>
<Button variant="outline" isLoading>Loading...</Button>
```

### Input
Text input component with label, error handling, and validation support.

```tsx
import { Input } from '@/components/ui';

<Input 
  label="Email" 
  type="email" 
  error="Invalid email"
  required 
/>
```

### Select
Dropdown select component with custom styling.

```tsx
import { Select } from '@/components/ui';

<Select 
  label="Country"
  options={[
    { value: 'us', label: 'United States' },
    { value: 'uk', label: 'United Kingdom' }
  ]}
  placeholder="Select a country"
/>
```

### Card
Container component for grouping related content.

**Variants:** `default`, `bordered`, `elevated`  
**Padding:** `none`, `sm`, `md`, `lg`

```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';

<Card variant="elevated">
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content goes here</CardContent>
</Card>
```

### Badge
Small status indicator component.

**Variants:** `default`, `success`, `warning`, `danger`, `info`, `secondary`  
**Sizes:** `sm`, `md`, `lg`

```tsx
import { Badge } from '@/components/ui';

<Badge variant="success">In Stock</Badge>
<Badge variant="danger">Sold Out</Badge>
```

### LoadingSpinner
Animated loading indicator.

**Sizes:** `sm`, `md`, `lg`, `xl`

```tsx
import { LoadingSpinner } from '@/components/ui';

<LoadingSpinner size="lg" label="Loading products..." />
```

### ErrorMessage
Component for displaying error messages.

**Variants:** `inline`, `banner`, `card`

```tsx
import { ErrorMessage } from '@/components/ui';

<ErrorMessage 
  title="Error"
  message="Something went wrong"
  variant="banner"
  onDismiss={() => console.log('dismissed')}
/>
```

### Modal
Modal dialog component with overlay.

**Sizes:** `sm`, `md`, `lg`, `xl`, `full`

```tsx
import { Modal, ModalFooter } from '@/components/ui';

<Modal 
  isOpen={isOpen}
  onClose={handleClose}
  title="Confirm Action"
  size="md"
>
  <p>Are you sure?</p>
  <ModalFooter>
    <Button onClick={handleClose}>Cancel</Button>
    <Button variant="primary">Confirm</Button>
  </ModalFooter>
</Modal>
```

## Features

- **TypeScript**: Full type safety with proper interfaces
- **Tailwind CSS**: Utility-first styling with dark mode support
- **Accessibility**: WCAG compliant with ARIA attributes
- **Responsive**: Mobile-first design approach
- **Composable**: Components can be combined and extended
- **Customizable**: All components accept className prop for overrides
