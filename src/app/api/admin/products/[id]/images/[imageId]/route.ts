import { NextRequest, NextResponse } from 'next/server';
import { unlink } from 'fs/promises';
import { join } from 'path';
import pool from '@/lib/db';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; imageId: string } }
) {
  try {
    const productId = parseInt(params.id);
    const imageId = parseInt(params.imageId);

    if (isNaN(productId) || isNaN(imageId)) {
      return NextResponse.json(
        { error: 'Invalid product or image ID' },
        { status: 400 }
      );
    }

    // Get image details before deleting
    const imageResult = await pool.query(
      'SELECT image_url FROM product_images WHERE id = $1 AND product_id = $2',
      [imageId, productId]
    );

    if (imageResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    const imageUrl = imageResult.rows[0].image_url;

    // Delete from database
    await pool.query(
      'DELETE FROM product_images WHERE id = $1 AND product_id = $2',
      [imageId, productId]
    );

    // Try to delete file from disk (non-blocking if it fails)
    try {
      const filepath = join(process.cwd(), 'public', imageUrl);
      await unlink(filepath);
    } catch (fileError) {
      console.warn('Could not delete file from disk:', fileError);
      // Continue anyway - database deletion is more important
    }

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully',
    });

  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete image', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
