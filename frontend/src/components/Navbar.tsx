import { Search, ShoppingCart, User, Menu, Heart } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="border-b border-gray-200 bg-white sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <a href="/" className="text-2xl font-bold text-primary">
              SumashTech
            </a>
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
              <a href="#" className="hover:text-primary">Home</a>
              <a href="#products" className="hover:text-primary">Products</a>
              <a href="#categories" className="hover:text-primary">Categories</a>
              <a href="#" className="hover:text-primary">About</a>
              <a href="#" className="hover:text-primary">Contact</a>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden md:flex items-center">
              <input
                type="text"
                placeholder="Search products..."
                className="w-64 pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
              />
              <Search className="absolute right-3 w-4 h-4 text-gray-400" />
            </div>

            <div className="flex items-center gap-3">
              <button className="p-2 hover:bg-gray-100 rounded-full">
                <Heart className="w-5 h-5 text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-full relative">
                <ShoppingCart className="w-5 h-5 text-gray-600" />
                <span className="absolute top-0 right-0 w-4 h-4 bg-primary text-white text-[10px] flex items-center justify-center rounded-full">
                  0
                </span>
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-full">
                <User className="w-5 h-5 text-gray-600" />
              </button>
              <button className="md:hidden p-2 hover:bg-gray-100 rounded-full">
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
