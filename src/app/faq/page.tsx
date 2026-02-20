'use client';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header cartItemCount={0} />
      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">FAQ</h1>
        <p className="text-gray-700">FAQ page coming soon.</p>
      </main>
      <Footer />
    </div>
  );
}
