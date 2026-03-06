import Link from 'next/link';

export default function Hero() {
  return (
    <section className="relative bg-gray-50 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Premium Tech <br />
              <span className="text-primary">Products</span> for You
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-lg mx-auto md:mx-0">
              Discover the latest gadgets and electronics at the best prices in Bangladesh. Quality guaranteed with fast delivery.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Link
                href="#products"
                className="bg-primary text-white px-8 py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors text-center"
              >
                Shop Now
              </Link>
              <Link
                href="#categories"
                className="bg-white text-gray-900 border border-gray-300 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors text-center"
              >
                Browse Categories
              </Link>
            </div>
          </div>
          <div className="flex-1 relative w-full max-w-lg mx-auto">
             <div className="aspect-square relative rounded-2xl overflow-hidden bg-gray-200 shadow-xl">
                <img
                  src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
                  alt="Latest Tech"
                  className="object-cover w-full h-full"
                />
             </div>
          </div>
        </div>
      </div>
    </section>
  );
}
