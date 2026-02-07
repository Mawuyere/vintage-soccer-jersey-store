import { query, transaction } from './index';
import { PoolClient } from 'pg';

// User Queries
export const userQueries = {
  findByEmail: async (email: string) => {
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0];
  },

  findById: async (id: number) => {
    const result = await query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0];
  },

  create: async (email: string, passwordHash: string, name: string, phone?: string) => {
    const result = await query(
      `INSERT INTO users (email, password_hash, name, phone) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [email, passwordHash, name, phone]
    );
    return result.rows[0];
  },

  update: async (id: number, updates: Record<string, unknown>) => {
    const allowedFields = ['email', 'password_hash', 'name', 'phone', 'email_verified'];
    const keys = Object.keys(updates).filter(key => allowedFields.includes(key));
    
    if (keys.length === 0) {
      throw new Error('No valid fields to update');
    }
    
    const values = keys.map(key => updates[key]);
    const setClause = keys.map((key, idx) => `${key} = $${idx + 2}`).join(', ');
    
    const result = await query(
      `UPDATE users SET ${setClause} WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    return result.rows[0];
  },

  delete: async (id: number) => {
    await query('DELETE FROM users WHERE id = $1', [id]);
  },

  setVerificationToken: async (id: number, token: string) => {
    await query(
      'UPDATE users SET verification_token = $1 WHERE id = $2',
      [token, id]
    );
  },

  verifyEmail: async (token: string) => {
    const result = await query(
      `UPDATE users SET email_verified = TRUE, verification_token = NULL 
       WHERE verification_token = $1 RETURNING *`,
      [token]
    );
    return result.rows[0];
  },

  setResetPasswordToken: async (email: string, token: string, expires: Date) => {
    const result = await query(
      `UPDATE users SET reset_password_token = $1, reset_password_expires = $2 
       WHERE email = $3 RETURNING *`,
      [token, expires, email]
    );
    return result.rows[0];
  },

  resetPassword: async (token: string, newPasswordHash: string) => {
    const result = await query(
      `UPDATE users SET password_hash = $1, reset_password_token = NULL, 
       reset_password_expires = NULL 
       WHERE reset_password_token = $2 AND reset_password_expires > NOW() 
       RETURNING *`,
      [newPasswordHash, token]
    );
    return result.rows[0];
  },
};

// Admin User Queries
export const adminQueries = {
  findByUserId: async (userId: number) => {
    const result = await query(
      `SELECT au.*, u.email, u.name FROM admin_users au 
       JOIN users u ON au.user_id = u.id 
       WHERE au.user_id = $1`,
      [userId]
    );
    return result.rows[0];
  },

  create: async (userId: number, role = 'admin', permissions = {}) => {
    const result = await query(
      `INSERT INTO admin_users (user_id, role, permissions) 
       VALUES ($1, $2, $3) RETURNING *`,
      [userId, role, JSON.stringify(permissions)]
    );
    return result.rows[0];
  },

  isAdmin: async (userId: number): Promise<boolean> => {
    const result = await query(
      'SELECT id FROM admin_users WHERE user_id = $1',
      [userId]
    );
    return result.rows.length > 0;
  },
};

// Product Queries
export const productQueries = {
  findAll: async (limit = 50, offset = 0) => {
    const result = await query(
      `SELECT p.*, 
       COALESCE(json_agg(pi.*) FILTER (WHERE pi.id IS NOT NULL), '[]') as images
       FROM products p
       LEFT JOIN product_images pi ON p.id = pi.product_id
       GROUP BY p.id
       ORDER BY p.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  },

  findById: async (id: number) => {
    const result = await query(
      `SELECT p.*, 
       COALESCE(json_agg(pi.*) FILTER (WHERE pi.id IS NOT NULL), '[]') as images
       FROM products p
       LEFT JOIN product_images pi ON p.id = pi.product_id
       WHERE p.id = $1
       GROUP BY p.id`,
      [id]
    );
    return result.rows[0];
  },

  findBySku: async (sku: string) => {
    const result = await query(
      'SELECT * FROM products WHERE sku = $1',
      [sku]
    );
    return result.rows[0];
  },

  search: async (filters: {
    team?: string;
    year?: string;
    condition?: string;
    minPrice?: number;
    maxPrice?: number;
    featured?: boolean;
  }, limit = 50, offset = 0) => {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramCount = 1;

    if (filters.team) {
      conditions.push(`team ILIKE $${paramCount}`);
      params.push(`%${filters.team}%`);
      paramCount++;
    }

    if (filters.year) {
      conditions.push(`year = $${paramCount}`);
      params.push(filters.year);
      paramCount++;
    }

    if (filters.condition) {
      conditions.push(`condition = $${paramCount}`);
      params.push(filters.condition);
      paramCount++;
    }

    if (filters.minPrice !== undefined) {
      conditions.push(`price >= $${paramCount}`);
      params.push(filters.minPrice);
      paramCount++;
    }

    if (filters.maxPrice !== undefined) {
      conditions.push(`price <= $${paramCount}`);
      params.push(filters.maxPrice);
      paramCount++;
    }

    if (filters.featured !== undefined) {
      conditions.push(`featured = $${paramCount}`);
      params.push(filters.featured);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    params.push(limit, offset);

    const result = await query(
      `SELECT p.*, 
       COALESCE(json_agg(pi.*) FILTER (WHERE pi.id IS NOT NULL), '[]') as images
       FROM products p
       LEFT JOIN product_images pi ON p.id = pi.product_id
       ${whereClause}
       GROUP BY p.id
       ORDER BY p.created_at DESC
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      params
    );
    return result.rows;
  },

  create: async (product: {
    name: string;
    team: string;
    year: string;
    price: number;
    condition: string;
    size: string;
    description?: string;
    sku: string;
    inventory?: number;
    featured?: boolean;
  }) => {
    const result = await query(
      `INSERT INTO products (name, team, year, price, condition, size, description, sku, inventory, featured)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        product.name,
        product.team,
        product.year,
        product.price,
        product.condition,
        product.size,
        product.description,
        product.sku,
        product.inventory || 1,
        product.featured || false,
      ]
    );
    return result.rows[0];
  },

  update: async (id: number, updates: Record<string, unknown>) => {
    const allowedFields = ['name', 'team', 'year', 'price', 'condition', 'size', 'description', 'sku', 'inventory', 'featured'];
    const keys = Object.keys(updates).filter(key => allowedFields.includes(key));
    
    if (keys.length === 0) {
      throw new Error('No valid fields to update');
    }
    
    const values = keys.map(key => updates[key]);
    const setClause = keys.map((key, idx) => `${key} = $${idx + 2}`).join(', ');
    
    const result = await query(
      `UPDATE products SET ${setClause} WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    return result.rows[0];
  },

  delete: async (id: number) => {
    await query('DELETE FROM products WHERE id = $1', [id]);
  },

  updateInventory: async (id: number, quantity: number) => {
    const result = await query(
      'UPDATE products SET inventory = inventory + $1 WHERE id = $2 RETURNING *',
      [quantity, id]
    );
    return result.rows[0];
  },
};

// Product Image Queries
export const productImageQueries = {
  create: async (productId: number, imageUrl: string, altText?: string, displayOrder = 0) => {
    const result = await query(
      `INSERT INTO product_images (product_id, image_url, alt_text, display_order)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [productId, imageUrl, altText, displayOrder]
    );
    return result.rows[0];
  },

  findByProductId: async (productId: number) => {
    const result = await query(
      'SELECT * FROM product_images WHERE product_id = $1 ORDER BY display_order',
      [productId]
    );
    return result.rows;
  },

  delete: async (id: number) => {
    await query('DELETE FROM product_images WHERE id = $1', [id]);
  },
};

// Cart Queries
export const cartQueries = {
  findByUserId: async (userId: number) => {
    const result = await query(
      `SELECT ci.*, p.name, p.price, p.team, p.year, p.inventory,
       COALESCE((SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY display_order LIMIT 1), '') as image_url
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.user_id = $1
       ORDER BY ci.created_at DESC`,
      [userId]
    );
    return result.rows;
  },

  addItem: async (userId: number, productId: number, quantity = 1) => {
    const result = await query(
      `INSERT INTO cart_items (user_id, product_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, product_id) 
       DO UPDATE SET quantity = cart_items.quantity + $3
       RETURNING *`,
      [userId, productId, quantity]
    );
    return result.rows[0];
  },

  updateQuantity: async (userId: number, productId: number, quantity: number) => {
    const result = await query(
      `UPDATE cart_items SET quantity = $1 
       WHERE user_id = $2 AND product_id = $3 
       RETURNING *`,
      [quantity, userId, productId]
    );
    return result.rows[0];
  },

  removeItem: async (userId: number, productId: number) => {
    await query(
      'DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2',
      [userId, productId]
    );
  },

  clearCart: async (userId: number) => {
    await query('DELETE FROM cart_items WHERE user_id = $1', [userId]);
  },
};

// Order Queries
export const orderQueries = {
  findById: async (id: number) => {
    const result = await query(
      `SELECT o.*, 
       COALESCE(json_agg(
         json_build_object(
           'id', oi.id,
           'product_id', oi.product_id,
           'product_snapshot', oi.product_snapshot,
           'quantity', oi.quantity,
           'price', oi.price
         )
       ) FILTER (WHERE oi.id IS NOT NULL), '[]') as items
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       WHERE o.id = $1
       GROUP BY o.id`,
      [id]
    );
    return result.rows[0];
  },

  findByUserId: async (userId: number, limit = 50, offset = 0) => {
    const result = await query(
      `SELECT o.*, 
       COUNT(oi.id) as item_count
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       WHERE o.user_id = $1
       GROUP BY o.id
       ORDER BY o.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return result.rows;
  },

  findAll: async (limit = 50, offset = 0) => {
    const result = await query(
      `SELECT o.*, u.email, u.name as user_name,
       COUNT(oi.id) as item_count
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       LEFT JOIN order_items oi ON o.id = oi.order_id
       GROUP BY o.id, u.email, u.name
       ORDER BY o.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  },

  create: async (
    userId: number,
    totalPrice: number,
    shippingAddress: Record<string, unknown>,
    items: Array<{ productId: number; quantity: number; price: number; productSnapshot: Record<string, unknown> }>
  ) => {
    return transaction(async (client: PoolClient) => {
      const orderResult = await client.query(
        `INSERT INTO orders (user_id, total_price, shipping_address, status)
         VALUES ($1, $2, $3, 'pending') RETURNING *`,
        [userId, totalPrice, JSON.stringify(shippingAddress)]
      );
      const order = orderResult.rows[0];

      for (const item of items) {
        await client.query(
          `INSERT INTO order_items (order_id, product_id, product_snapshot, quantity, price)
           VALUES ($1, $2, $3, $4, $5)`,
          [order.id, item.productId, JSON.stringify(item.productSnapshot), item.quantity, item.price]
        );

        await client.query(
          'UPDATE products SET inventory = inventory - $1 WHERE id = $2',
          [item.quantity, item.productId]
        );
      }

      return order;
    });
  },

  updateStatus: async (id: number, status: string) => {
    const result = await query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    return result.rows[0];
  },

  updateTracking: async (id: number, trackingNumber: string) => {
    const result = await query(
      'UPDATE orders SET tracking_number = $1 WHERE id = $2 RETURNING *',
      [trackingNumber, id]
    );
    return result.rows[0];
  },

  addNotes: async (id: number, notes: string) => {
    const result = await query(
      'UPDATE orders SET notes = $1 WHERE id = $2 RETURNING *',
      [notes, id]
    );
    return result.rows[0];
  },
};

// Payment Queries
export const paymentQueries = {
  create: async (
    orderId: number,
    paymentMethod: string,
    amount: number,
    transactionId?: string,
    paymentDetails?: Record<string, unknown>
  ) => {
    const result = await query(
      `INSERT INTO payments (order_id, payment_method, transaction_id, amount, status, payment_details)
       VALUES ($1, $2, $3, $4, 'pending', $5) RETURNING *`,
      [orderId, paymentMethod, transactionId, amount, JSON.stringify(paymentDetails)]
    );
    return result.rows[0];
  },

  updateStatus: async (id: number, status: string, transactionId?: string) => {
    const result = await query(
      `UPDATE payments SET status = $1, transaction_id = COALESCE($2, transaction_id)
       WHERE id = $3 RETURNING *`,
      [status, transactionId, id]
    );
    return result.rows[0];
  },

  findByOrderId: async (orderId: number) => {
    const result = await query(
      'SELECT * FROM payments WHERE order_id = $1 ORDER BY created_at DESC',
      [orderId]
    );
    return result.rows;
  },
};

// Address Queries
export const addressQueries = {
  findByUserId: async (userId: number) => {
    const result = await query(
      'SELECT * FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC',
      [userId]
    );
    return result.rows;
  },

  findById: async (id: number) => {
    const result = await query(
      'SELECT * FROM addresses WHERE id = $1',
      [id]
    );
    return result.rows[0];
  },

  create: async (
    userId: number,
    street: string,
    city: string,
    state: string,
    zip: string,
    country: string,
    isDefault = false
  ) => {
    return transaction(async (client: PoolClient) => {
      if (isDefault) {
        await client.query(
          'UPDATE addresses SET is_default = FALSE WHERE user_id = $1',
          [userId]
        );
      }

      const result = await client.query(
        `INSERT INTO addresses (user_id, street, city, state, zip, country, is_default)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [userId, street, city, state, zip, country, isDefault]
      );
      return result.rows[0];
    });
  },

  setDefault: async (userId: number, addressId: number) => {
    return transaction(async (client: PoolClient) => {
      await client.query(
        'UPDATE addresses SET is_default = FALSE WHERE user_id = $1',
        [userId]
      );

      const result = await client.query(
        'UPDATE addresses SET is_default = TRUE WHERE id = $1 AND user_id = $2 RETURNING *',
        [addressId, userId]
      );
      return result.rows[0];
    });
  },

  delete: async (id: number, userId: number) => {
    await query('DELETE FROM addresses WHERE id = $1 AND user_id = $2', [id, userId]);
  },
};
