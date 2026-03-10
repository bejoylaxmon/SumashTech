import ProductList from "@/components/ProductList";
import HeroSlider from "@/components/HeroSlider";
import Link from "next/link";

export default function Home() {
  return (
    <div className="bg-gray-50 pb-20 font-sans">
      {/* Hero Slider Section */}
      <section className="container mx-auto px-4 py-8">
        <HeroSlider />
      </section>

      {/* Popular Categories */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-secondary flex items-center gap-2">
            <span className="w-2 h-8 bg-primary rounded-full"></span>
            Shop By Popular Categories
          </h2>
          <Link href="/categories" className="text-primary font-bold hover:underline">View All</Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {[
            { name: 'iPhone', icon: '📱', slug: 'smartphone-iphone' },
            { name: 'Laptop', icon: '💻', slug: 'laptop' },
            { name: 'Mac', icon: '🖥️', slug: 'mac' },
            { name: 'Tablet', icon: '📟', slug: 'tablet' },
            { name: 'Smart Watch', icon: '⌚', slug: 'accessories-smart-watch' },
            { name: 'Gaming', icon: '🎮', slug: 'gadgets' },
          ].map((cat) => (
            <Link href={`/category/${cat.slug}`} key={cat.slug} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all text-center group cursor-pointer border border-transparent hover:border-primary/20">
              <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">{cat.icon}</div>
              <h3 className="font-bold text-gray-800 text-sm group-hover:text-primary transition-colors">{cat.name}</h3>
            </Link>
          ))}
        </div>
      </section>

      {/* Today's Best Deal */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-2xl font-bold text-secondary flex items-center gap-2">
              <span className="w-2 h-8 bg-primary rounded-full"></span>
              Today's Best Deal
            </h2>
            <div className="flex gap-2">
              <button className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center hover:bg-gray-50 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center hover:bg-gray-50 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
          <ProductList title="Today's Best Deal" filter="isFeatured" />
        </div>
      </section>

      {/* New Arrival */}
      <section className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-2xl font-bold text-secondary flex items-center gap-2">
            <span className="w-2 h-8 bg-primary rounded-full"></span>
            New Arrival
          </h2>
          <Link href="/new-arrivals" className="text-primary font-bold hover:underline">See More</Link>
        </div>
        <ProductList title="New Arrival" filter="isNew" />
      </section>

      {/* Brands Section Placeholder */}
      <section className="container mx-auto px-4 py-12 border-t border-gray-100">
        <div className="flex flex-wrap items-center justify-center gap-12 grayscale opacity-40 hover:opacity-100 transition-opacity">
          <div className="font-black text-2xl tracking-tighter">Apple</div>
          <div className="font-black text-2xl tracking-tighter">SAMSUNG</div>
          <div className="font-black text-2xl tracking-tighter">Google</div>
          <div className="font-black text-2xl tracking-tighter">SONY</div>
          <div className="font-black text-2xl tracking-tighter">Lenovo</div>
          <div className="font-black text-2xl tracking-tighter">acer</div>
        </div>
      </section>
    </div>
  );
}
