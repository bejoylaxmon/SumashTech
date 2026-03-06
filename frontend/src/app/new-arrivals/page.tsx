import ProductCard from '@/components/ProductCard';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:54321';

async function getNewArrivals() {
  try {
    const res = await fetch(`${API_BASE}/api/products?isNew=true`, {
      cache: 'no-store'
    });

    if (!res.ok) {
      throw new Error('Failed to fetch products');
    }

    return res.json();
  } catch (error) {
    console.error('Error fetching new arrivals:', error);
    return [];
  }
}

export default async function NewArrivalsPage() {
  const products = await getNewArrivals();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary mb-2">New Arrivals</h1>
        <p className="text-gray-600">Check out the latest products added to our store</p>
      </div>

      {products.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {products.map((product: any) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-gray-50 rounded-3xl">
          <p className="text-gray-500 text-lg">No new arrivals found.</p>
        </div>
      )}
    </div>
  );
}
