import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import pool from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = parseInt(params.id);
    
    if (isNaN(productId)) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    // Verify product exists
    const productCheck = await pool.query(
      'SELECT id FROM products WHERE id = $1',
      [productId]
    );

    if (productCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll('images') as File[];

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    // Ensure upload directory exists
    const uploadDir = join(process.cwd(), 'public', 'images', 'products');
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      // Directory might already exist, ignore error
    }

    // Get current max display order
    const displayOrderResult = await pool.query(
      'SELECT COALESCE(MAX(display_order), 0) as max_order FROM product_images WHERE product_id = $1',
      [productId]
    );
    let displayOrder = displayOrderResult.rows[0].max_order;

    const uploadedImages = [];

    // Process each file
    for (const file of files) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        continue; // Skip non-image files
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(7);
      const extension = file.name.split('.').pop() || 'jpg';
      const filename = `product-${productId}-${timestamp}-${randomString}.${extension}`;

      // Convert File to Buffer
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Save file to disk
      const filepath = join(uploadDir, filename);
      await writeFile(filepath, buffer);

      // Generate URL path (relative to public directory)
      const imageUrl = `/images/products/${filename}`;

      // Insert into database
      displayOrder++;
      const result = await pool.query(
        `INSERT INTO product_images (product_id, image_url, display_order)
         VALUES ($1, $2, $3)
         RETURNING id, product_id, image_url, display_order`,
        [productId, imageUrl, displayOrder]
      );

      uploadedImages.push(result.rows[0]);
    }

    if (uploadedImages.length === 0) {
      return NextResponse.json(
        { error: 'No valid image files provided' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      uploadedCount: uploadedImages.length,
      images: uploadedImages,
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload images', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
