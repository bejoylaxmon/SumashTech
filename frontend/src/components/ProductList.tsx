'use client';

import { useEffect, useState } from 'react';
import ProductCard from './ProductCard';
import { API_BASE } from '@/lib/api';

interface ProductListProps {
  title: string;
  filter?: string;
}

export default function ProductList({ title, filter }: ProductListProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const url = `${API_BASE}/api/products${filter ? `?${filter}=true` : ''}`;
        const res = await fetch(url);
        const data = await res.json();
        if (Array.isArray(data)) {
          setProducts(data);
        } else {
          setProducts([]);
          if (data.error) setError(data.error);
        }
      } catch (err: any) {
        console.error('Failed to fetch products:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [filter]);

  if (loading) return <div className="py-10 text-center text-gray-500">Loading products...</div>;
  if (error) return <div className="py-10 text-center text-red-500">Error: {error}</div>;
  if (!Array.isArray(products) || products.length === 0) return <div className="py-10 text-center text-gray-500">No products found.</div>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
