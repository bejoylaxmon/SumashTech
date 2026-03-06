import ProductList from "@/components/ProductList";
import Link from "next/link";

export default function Home() {
  return (
    <div className="bg-gray-50 pb-20">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Banner */}
          <div className="lg:col-span-3 rounded-2xl overflow-hidden shadow-lg relative h-[300px] md:h-[450px] bg-gradient-to-br from-secondary to-gray-800 flex items-center justify-center">
            <div className="text-center px-6">
              <h1 className="text-white text-3xl md:text-5xl font-bold mb-4">iPhone 16 Pro Max</h1>
              <p className="text-gray-300 mb-8 max-w-md mx-auto">Experience the ultimate Apple innovation. Available now at Sumash Tech with best price.</p>
              <Link href="/category/smartphone-iphone" className="inline-block bg-primary text-white font-bold px-8 py-3 rounded-full hover:bg-orange-600 transition-colors shadow-lg">Shop Now</Link>
            </div>
            {/* Pattern/Decoration */}
            <div className="absolute top-10 right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl opacity-50"></div>
            <div className="absolute bottom-10 left-10 w-32 h-32 bg-white/5 rounded-full blur-3xl opacity-50"></div>
          </div>
          {/* Side Banners */}
          <div className="hidden lg:flex flex-col gap-6">
            <div className="flex-1 rounded-2xl overflow-hidden shadow-md bg-gradient-to-r from-orange-500 to-primary p-6 flex flex-col justify-center">
              <span className="text-white/80 text-xs font-bold uppercase mb-1">New Arrival</span>
              <h3 className="text-white font-bold text-xl mb-3">MacBook Air M3</h3>
              <Link href="/category/mac" className="w-fit bg-secondary text-white text-xs font-bold px-4 py-2 rounded-full hover:bg-black transition-colors">Explore</Link>
            </div>
            <div className="flex-1 rounded-2xl overflow-hidden shadow-md bg-white border border-gray-100 p-6 flex flex-col justify-center">
              <span className="text-primary text-xs font-bold uppercase mb-1">Weekly Sale</span>
              <h3 className="text-secondary font-bold text-xl mb-3">Save up to 30%</h3>
              <Link href="/deals" className="w-fit bg-primary text-white text-xs font-bold px-4 py-2 rounded-full hover:bg-orange-600 transition-colors">View Deals</Link>
            </div>
          </div>
        </div>
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
