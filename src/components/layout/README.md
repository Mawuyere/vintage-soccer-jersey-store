# Layout Components

This directory contains layout components for the Vintage Soccer Jersey Store.

## Components

### Header
Main site header with navigation, cart, and user menu.

```tsx
import { Header } from '@/components/layout';

<Header 
  cartItemCount={3}
  isAuthenticated={true}
  userName="John Doe"
/>
```

**Features:**
- Responsive navigation with mobile hamburger menu
- Shopping cart with item count badge
- User menu with profile/logout options
- Login/signup buttons for unauthenticated users
- Sticky positioning
- Dark mode support

### Navigation
Navigation component used within Header for both mobile and desktop.

```tsx
import { Navigation } from '@/components/layout';

<Navigation isOpen={isOpen} onClose={handleClose} />
```

**Features:**
- Desktop horizontal navigation
- Mobile slide-out sidebar
- Smooth transitions
- Accessible keyboard navigation

### Footer
Site footer with links and company information.

```tsx
import { Footer } from '@/components/layout';

<Footer />
```

**Features:**
- Multi-column link sections (Shop, Company, Support, Legal)
- Newsletter subscription form
- Social media links
- Responsive grid layout
- Copyright notice

## Usage

These layout components are typically used in the root layout:

```tsx
import { Header, Footer } from '@/components/layout';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
```

## Features

- **Fully Responsive**: Adapts to all screen sizes
- **Accessibility**: Proper ARIA labels and semantic HTML
- **Dark Mode**: Complete dark mode support
- **TypeScript**: Full type safety
- **Lucide Icons**: Clean, modern iconography
