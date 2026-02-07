const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  database: process.env.DATABASE_NAME || 'vintage_jerseys',
  user: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
});

const vintageJerseys = [
  {
    name: 'Real Madrid Home Jersey',
    team: 'Real Madrid',
    year: '1998-2000',
    price: 299.99,
    condition: 'Excellent',
    size: 'L',
    description: 'Classic white Real Madrid jersey from the Champions League winning era. Features the iconic Adidas design and Teka sponsor.',
    sku: 'RM-1998-HOME-L',
    inventory: 1,
    featured: true,
    imageUrl: 'https://images.unsplash.com/photo-1551854838-4660e974b9fa?w=500',
  },
  {
    name: 'Barcelona Home Jersey',
    team: 'FC Barcelona',
    year: '1996-1997',
    price: 349.99,
    condition: 'Mint',
    size: 'M',
    description: 'Legendary Barcelona jersey with Kappa design. Worn during Ronaldo\'s era. Features blue and red stripes.',
    sku: 'FCB-1996-HOME-M',
    inventory: 1,
    featured: true,
    imageUrl: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=500',
  },
  {
    name: 'Manchester United Treble Jersey',
    team: 'Manchester United',
    year: '1998-1999',
    price: 450.00,
    condition: 'Excellent',
    size: 'L',
    description: 'Historic Manchester United jersey from the legendary treble-winning season. Sharp Viewcam sponsor.',
    sku: 'MUFC-1998-HOME-L',
    inventory: 1,
    featured: true,
    imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=500',
  },
  {
    name: 'Liverpool Away Jersey',
    team: 'Liverpool FC',
    year: '1989-1991',
    price: 275.00,
    condition: 'Good',
    size: 'M',
    description: 'Classic Liverpool away jersey in white with red and green trim. Candy sponsor, Adidas design.',
    sku: 'LFC-1989-AWAY-M',
    inventory: 1,
    featured: false,
    imageUrl: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=500',
  },
  {
    name: 'AC Milan Home Jersey',
    team: 'AC Milan',
    year: '1994-1995',
    price: 320.00,
    condition: 'Excellent',
    size: 'L',
    description: 'Iconic AC Milan jersey with red and black stripes. From the era of Baresi and Maldini.',
    sku: 'ACM-1994-HOME-L',
    inventory: 1,
    featured: true,
    imageUrl: 'https://images.unsplash.com/photo-1551854838-4660e974b9fa?w=500',
  },
  {
    name: 'Bayern Munich Home Jersey',
    team: 'Bayern Munich',
    year: '2001-2002',
    price: 289.99,
    condition: 'Excellent',
    size: 'XL',
    description: 'Bayern Munich Champions League winning jersey. Adidas design with T-Mobile sponsor.',
    sku: 'FCB-2001-HOME-XL',
    inventory: 1,
    featured: false,
    imageUrl: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=500',
  },
  {
    name: 'Ajax Amsterdam Home Jersey',
    team: 'Ajax',
    year: '1995-1996',
    price: 385.00,
    condition: 'Mint',
    size: 'M',
    description: 'Classic Ajax jersey with iconic red and white design. Champions League winning season.',
    sku: 'AJAX-1995-HOME-M',
    inventory: 1,
    featured: true,
    imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=500',
  },
  {
    name: 'Juventus Home Jersey',
    team: 'Juventus',
    year: '1997-1998',
    price: 310.00,
    condition: 'Excellent',
    size: 'L',
    description: 'Classic Juventus black and white stripes. Kappa design with Sony sponsor.',
    sku: 'JUVE-1997-HOME-L',
    inventory: 1,
    featured: false,
    imageUrl: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=500',
  },
  {
    name: 'Inter Milan Home Jersey',
    team: 'Inter Milan',
    year: '1991-1992',
    price: 295.00,
    condition: 'Good',
    size: 'M',
    description: 'Vintage Inter Milan jersey with black and blue stripes. UEFA Cup winning season.',
    sku: 'INTER-1991-HOME-M',
    inventory: 1,
    featured: false,
    imageUrl: 'https://images.unsplash.com/photo-1551854838-4660e974b9fa?w=500',
  },
  {
    name: 'Arsenal Away Jersey',
    team: 'Arsenal',
    year: '1991-1993',
    price: 265.00,
    condition: 'Good',
    size: 'L',
    description: 'Iconic Arsenal away jersey in yellow with blue trim. JVC sponsor, Adidas design.',
    sku: 'ARS-1991-AWAY-L',
    inventory: 1,
    featured: false,
    imageUrl: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=500',
  },
  {
    name: 'PSG Home Jersey',
    team: 'Paris Saint-Germain',
    year: '1993-1994',
    price: 255.00,
    condition: 'Fair',
    size: 'M',
    description: 'Classic PSG jersey with navy blue and red design. Commodore sponsor.',
    sku: 'PSG-1993-HOME-M',
    inventory: 1,
    featured: false,
    imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=500',
  },
  {
    name: 'Borussia Dortmund Home Jersey',
    team: 'Borussia Dortmund',
    year: '1996-1997',
    price: 340.00,
    condition: 'Excellent',
    size: 'L',
    description: 'Champions League winning Borussia Dortmund jersey. Nike design in yellow and black.',
    sku: 'BVB-1996-HOME-L',
    inventory: 1,
    featured: true,
    imageUrl: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=500',
  },
  {
    name: 'Chelsea Home Jersey',
    team: 'Chelsea',
    year: '1997-1999',
    price: 280.00,
    condition: 'Good',
    size: 'XL',
    description: 'Classic Chelsea blue jersey. Autoglass sponsor, Umbro design.',
    sku: 'CFC-1997-HOME-XL',
    inventory: 1,
    featured: false,
    imageUrl: 'https://images.unsplash.com/photo-1551854838-4660e974b9fa?w=500',
  },
  {
    name: 'Atletico Madrid Home Jersey',
    team: 'Atletico Madrid',
    year: '1995-1996',
    price: 270.00,
    condition: 'Good',
    size: 'M',
    description: 'Atletico Madrid jersey with red and white stripes. La Liga and Copa del Rey double winning season.',
    sku: 'ATM-1995-HOME-M',
    inventory: 1,
    featured: false,
    imageUrl: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=500',
  },
  {
    name: 'AS Roma Home Jersey',
    team: 'AS Roma',
    year: '2000-2001',
    price: 315.00,
    condition: 'Excellent',
    size: 'L',
    description: 'Roma Scudetto winning jersey. Iconic maroon and orange colors. Kappa design.',
    sku: 'ROMA-2000-HOME-L',
    inventory: 1,
    featured: true,
    imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=500',
  },
];

async function seedDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('Starting database seeding...');
    
    await client.query('BEGIN');
    
    console.log('Creating admin user...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, name, email_verified)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
       RETURNING id`,
      ['admin@example.com', hashedPassword, 'Admin User', true]
    );
    const adminUserId = userResult.rows[0].id;
    
    await client.query(
      `INSERT INTO admin_users (user_id, role)
       VALUES ($1, 'admin')
       ON CONFLICT (user_id) DO NOTHING`,
      [adminUserId]
    );
    console.log('✅ Admin user created (email: admin@example.com, password: admin123)');
    
    console.log('Creating sample customer users...');
    const customerPassword = await bcrypt.hash('password123', 10);
    await client.query(
      `INSERT INTO users (email, password_hash, name, phone, email_verified)
       VALUES 
       ('john.doe@example.com', $1, 'John Doe', '+1234567890', true),
       ('jane.smith@example.com', $1, 'Jane Smith', '+1987654321', true)
       ON CONFLICT (email) DO NOTHING`,
      [customerPassword]
    );
    console.log('✅ Sample customer users created');
    
    console.log('Inserting vintage jerseys...');
    for (const jersey of vintageJerseys) {
      const productResult = await client.query(
        `INSERT INTO products (name, team, year, price, condition, size, description, sku, inventory, featured)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (sku) DO UPDATE SET 
           price = EXCLUDED.price,
           inventory = EXCLUDED.inventory,
           featured = EXCLUDED.featured
         RETURNING id`,
        [
          jersey.name,
          jersey.team,
          jersey.year,
          jersey.price,
          jersey.condition,
          jersey.size,
          jersey.description,
          jersey.sku,
          jersey.inventory,
          jersey.featured,
        ]
      );
      
      const productId = productResult.rows[0].id;
      
      await client.query(
        `INSERT INTO product_images (product_id, image_url, alt_text, display_order)
         VALUES ($1, $2, $3, 0)
         ON CONFLICT DO NOTHING`,
        [productId, jersey.imageUrl, `${jersey.name} ${jersey.year}`]
      );
    }
    console.log(`✅ Inserted ${vintageJerseys.length} vintage jerseys`);
    
    console.log('Creating sample addresses...');
    const johnUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      ['john.doe@example.com']
    );
    if (johnUser.rows.length > 0) {
      await client.query(
        `INSERT INTO addresses (user_id, street, city, state, zip, country, is_default)
         VALUES ($1, '123 Main Street', 'New York', 'NY', '10001', 'USA', true)
         ON CONFLICT DO NOTHING`,
        [johnUser.rows[0].id]
      );
    }
    console.log('✅ Sample addresses created');
    
    await client.query('COMMIT');
    
    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Admin user: admin@example.com (password: admin123)`);
    console.log(`   - Sample users: john.doe@example.com, jane.smith@example.com (password: password123)`);
    console.log(`   - Products: ${vintageJerseys.length} vintage jerseys`);
    console.log(`   - Featured products: ${vintageJerseys.filter(j => j.featured).length}`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedDatabase().catch((error) => {
  console.error('Seed error:', error);
  process.exit(1);
});
