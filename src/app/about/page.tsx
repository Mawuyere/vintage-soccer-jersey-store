'use client';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header cartItemCount={0} />

      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">About Vintage Jerseys</h1>

          <div className="space-y-6 text-gray-700">
            <p className="text-lg">
              Welcome to Vintage Jerseys, your premier destination for authentic vintage and retro soccer jerseys from around the world.
            </p>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">Our Story</h2>
              <p>
                Founded with a passion for football history, Vintage Jerseys was created to preserve and celebrate the iconic kits that define the beautiful game. Each jersey in our collection tells a story of legendary teams, unforgettable moments, and the evolution of football fashion.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">Our Mission</h2>
              <p>
                We believe that vintage jerseys are more than just clothing—they're pieces of history. Our mission is to make these rare and authentic jerseys accessible to collectors, fans, and enthusiasts worldwide, while maintaining the highest standards of authenticity and quality.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">What We Offer</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>Carefully curated collection of authentic vintage jerseys</li>
                <li>Detailed condition assessments and authentic provenance</li>
                <li>Jersey from top leagues and national teams worldwide</li>
                <li>Expert knowledge and passion for football history</li>
                <li>Secure and reliable shipping to customers globally</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">Quality Guarantee</h2>
              <p>
                We stand behind every jersey we sell. All items are authenticated, and we provide detailed condition reports. If you have any concerns about your purchase, our customer service team is here to help.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
