import Link from "next/link";

async function getCategories() {
  try {
    const res = await fetch('http://localhost:54321/api/categories', {
      cache: 'no-store'
    });

    if (!res.ok) {
      throw new Error('Failed to fetch categories');
    }

    return res.json();
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

const categoryIcons: Record<string, string> = {
  'smartphone-iphone': '📱',
  'laptop': '💻',
  'mac': '🖥️',
  'tablet': '📟',
  'accessories-smart-watch': '⌚',
  'gadgets': '🎮',
  'audio': '🎧',
  'camera': '📷',
  'storage': '💾',
  'accessories': '🔌',
  'networking': '📡',
  'software': '💿',
};

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary mb-2">Shop by Category</h1>
        <p className="text-gray-600">Browse our wide range of products by category</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {categories.map((cat: any) => (
          <Link
            href={`/products?category=${cat.slug}`}
            key={cat.id}
            className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all text-center group cursor-pointer border border-transparent hover:border-primary/20 flex flex-col items-center"
          >
            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">
              {categoryIcons[cat.slug] || '📦'}
            </div>
            <h3 className="font-bold text-gray-800 text-lg mb-2 group-hover:text-primary transition-colors">{cat.name}</h3>
            <p className="text-xs text-gray-500">Authentic Products</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
