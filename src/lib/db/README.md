# Database Connection and Utilities

This directory contains the PostgreSQL database connection pool and query helper functions for the Vintage Soccer Jersey Store.

## Files

- **index.ts** - Database connection pool configuration and helper functions
- **queries.ts** - Type-safe query functions for all database tables

## Environment Variables

Configure the following environment variables in your `.env` file:

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=vintage_jerseys
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DB_POOL_MAX=20
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=2000
```

## Database Connection

The database connection uses `pg` (node-postgres) with connection pooling for optimal performance.

### Basic Query

```typescript
import { query } from '@/lib/db';

const result = await query('SELECT * FROM products WHERE id = $1', [1]);
console.log(result.rows[0]);
```

### Transaction

```typescript
import { transaction } from '@/lib/db';

const result = await transaction(async (client) => {
  await client.query('UPDATE products SET inventory = inventory - 1 WHERE id = $1', [1]);
  await client.query('INSERT INTO orders (...) VALUES (...)', [...]);
  return { success: true };
});
```

### Test Connection

```typescript
import { testConnection } from '@/lib/db';

const isConnected = await testConnection();
```

## Query Helpers

All query functions use parameterized queries to prevent SQL injection and return typed results.

### User Queries

```typescript
import { userQueries } from '@/lib/db/queries';

// Find user by email
const user = await userQueries.findByEmail('user@example.com');

// Create user
const newUser = await userQueries.create(
  'email@example.com',
  hashedPassword,
  'John Doe',
  '+1234567890'
);

// Update user
await userQueries.update(userId, { name: 'New Name' });

// Verify email
await userQueries.verifyEmail(verificationToken);
```

### Product Queries

```typescript
import { productQueries } from '@/lib/db/queries';

// Get all products with images
const products = await productQueries.findAll(50, 0);

// Find product by ID
const product = await productQueries.findById(1);

// Search products
const results = await productQueries.search({
  team: 'Real Madrid',
  condition: 'Excellent',
  minPrice: 200,
  maxPrice: 400
}, 20, 0);

// Create product
const newProduct = await productQueries.create({
  name: 'Jersey Name',
  team: 'Team Name',
  year: '1990-1991',
  price: 299.99,
  condition: 'Excellent',
  size: 'L',
  description: 'Product description',
  sku: 'UNIQUE-SKU',
  inventory: 1,
  featured: false
});
```

### Cart Queries

```typescript
import { cartQueries } from '@/lib/db/queries';

// Get user's cart
const cartItems = await cartQueries.findByUserId(userId);

// Add item to cart
await cartQueries.addItem(userId, productId, 1);

// Update quantity
await cartQueries.updateQuantity(userId, productId, 2);

// Remove item
await cartQueries.removeItem(userId, productId);

// Clear cart
await cartQueries.clearCart(userId);
```

### Order Queries

```typescript
import { orderQueries } from '@/lib/db/queries';

// Get order with items
const order = await orderQueries.findById(orderId);

// Get user orders
const orders = await orderQueries.findByUserId(userId);

// Create order (uses transaction internally)
const newOrder = await orderQueries.create(
  userId,
  totalPrice,
  shippingAddress,
  orderItems
);

// Update order status
await orderQueries.updateStatus(orderId, 'shipped');

// Add tracking number
await orderQueries.updateTracking(orderId, 'TRACK123');
```

### Address Queries

```typescript
import { addressQueries } from '@/lib/db/queries';

// Get user addresses
const addresses = await addressQueries.findByUserId(userId);

// Create address
const address = await addressQueries.create(
  userId,
  '123 Main St',
  'New York',
  'NY',
  '10001',
  'USA',
  true // isDefault
);

// Set default address
await addressQueries.setDefault(userId, addressId);
```

### Admin Queries

```typescript
import { adminQueries } from '@/lib/db/queries';

// Check if user is admin
const isAdmin = await adminQueries.isAdmin(userId);

// Create admin user
await adminQueries.create(userId, 'admin', { canManageProducts: true });
```

## Database Scripts

### Migration

Run database migrations to create all tables:

```bash
npm run db:migrate
```

### Seed

Seed the database with sample data:

```bash
npm run db:seed
```

This will create:
- Admin user (admin@example.com / admin123)
- Sample customer users
- 15 vintage soccer jerseys
- Sample addresses

## Best Practices

1. **Always use parameterized queries** - Never concatenate user input into SQL strings
2. **Use transactions for multi-step operations** - Ensures data consistency
3. **Handle errors appropriately** - All queries may throw errors
4. **Close connections when done** - The pool manages this automatically
5. **Use appropriate types** - Leverage TypeScript for type safety

## Error Handling

```typescript
try {
  const user = await userQueries.findByEmail(email);
  if (!user) {
    throw new Error('User not found');
  }
} catch (error) {
  console.error('Database error:', error);
  // Handle error appropriately
}
```

## Connection Pool

The connection pool automatically manages database connections:
- Creates new connections as needed (up to `DB_POOL_MAX`)
- Reuses idle connections
- Closes idle connections after `DB_IDLE_TIMEOUT`
- Handles connection errors gracefully

## Testing Connection

Before running your application, test the database connection:

```typescript
import { testConnection } from '@/lib/db';

testConnection().then(success => {
  if (success) {
    console.log('✅ Database connected');
  } else {
    console.error('❌ Database connection failed');
  }
});
```
