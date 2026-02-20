'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

interface Product {
  id: number;
  name: string;
  team: string;
  year: number;
  price: number;
  stock: number;
  images: { id: number; imageUrl: string; displayOrder: number }[];
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [uploadFiles, setUploadFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products?limit=200');
      const data = await response.json();
      setProducts(data.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setMessage({ type: 'error', text: 'Failed to load products' });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadFiles(e.target.files);
    }
  };

  const handleUpload = async () => {
    if (!selectedProduct || !uploadFiles || uploadFiles.length === 0) {
      setMessage({ type: 'error', text: 'Please select a product and files to upload' });
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      
      // Add all selected files to FormData
      Array.from(uploadFiles).forEach((file) => {
        formData.append('images', file);
      });

      const response = await fetch(`/api/admin/products/${selectedProduct.id}/upload`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      setMessage({ type: 'success', text: `Successfully uploaded ${result.uploadedCount} image(s)` });
      
      // Refresh products list
      await fetchProducts();
      
      // Clear file input
      setUploadFiles(null);
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
    } catch (error) {
      console.error('Upload error:', error);
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to upload images' 
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (productId: number, imageId: number) => {
    if (!confirm('Are you sure you want to delete this image?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/products/${productId}/images/${imageId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to delete image');
      }

      setMessage({ type: 'success', text: 'Image deleted successfully' });
      await fetchProducts();
    } catch (error) {
      console.error('Delete error:', error);
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to delete image' 
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">Loading products...</div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Product Image Management</h1>
          <p className="mt-2 text-gray-600">Upload and manage product images</p>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-md ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Selection & Upload Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Upload Images</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Product
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => {
                    const product = products.find(p => p.id === parseInt(e.target.value));
                    setSelectedProduct(product || null);
                  }}
                  value={selectedProduct?.id || ''}
                >
                  <option value="">Choose a product...</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} - {product.team} ({product.year})
                    </option>
                  ))}
                </select>
              </div>

              {selectedProduct && (
                <div className="p-4 bg-blue-50 rounded-md border border-blue-200">
                  <h3 className="font-medium text-blue-900 mb-2">{selectedProduct.name}</h3>
                  <p className="text-sm text-blue-700">
                    Team: {selectedProduct.team} | Year: {selectedProduct.year}
                  </p>
                  <p className="text-sm text-blue-700">
                    Current Images: {selectedProduct.images.length}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Images
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!selectedProduct || uploading}
                />
                <p className="mt-2 text-sm text-gray-500">
                  Select one or multiple images (JPG, PNG, WebP)
                </p>
              </div>

              {uploadFiles && uploadFiles.length > 0 && (
                <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Selected files: {uploadFiles.length}
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {Array.from(uploadFiles).map((file, index) => (
                      <li key={index}>• {file.name}</li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                onClick={handleUpload}
                disabled={!selectedProduct || !uploadFiles || uploading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {uploading ? 'Uploading...' : 'Upload Images'}
              </button>
            </div>
          </div>

          {/* Current Images Preview */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Current Images</h2>
            
            {selectedProduct ? (
              selectedProduct.images.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {selectedProduct.images
                    .sort((a, b) => a.displayOrder - b.displayOrder)
                    .map((image) => (
                      <div key={image.id} className="relative group">
                        <div className="aspect-square relative rounded-md overflow-hidden border border-gray-200 bg-gray-100">
                          {image.imageUrl ? (
                            <Image
                              src={image.imageUrl}
                              alt={`Product image ${image.displayOrder}`}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 50vw, 25vw"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full text-gray-400">
                              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteImage(selectedProduct.id, image.id)}
                          className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                          title="Delete image"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                        <p className="text-xs text-gray-500 mt-1 text-center">
                          Order: {image.displayOrder}
                        </p>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="mt-2">No images uploaded yet</p>
                </div>
              )
            ) : (
              <div className="text-center py-12 text-gray-400">
                Select a product to view images
              </div>
            )}
          </div>
        </div>

        {/* All Products List */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">All Products ({products.length})</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Team
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Year
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Images
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr 
                    key={product.id}
                    className={`hover:bg-gray-50 cursor-pointer ${
                      selectedProduct?.id === product.id ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => setSelectedProduct(product)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {product.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.team}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.year}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.images.length}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.stock}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${typeof product.price === 'number' ? product.price.toFixed(2) : Number(product.price).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
