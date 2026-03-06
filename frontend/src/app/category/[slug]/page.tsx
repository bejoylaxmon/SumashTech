'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { API_BASE } from '@/lib/api';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';

const categoryNames: Record<string, string> = {
    'smartphone-iphone': 'iPhone',
    'laptop': 'Laptop',
    'mac': 'Mac',
    'tablet': 'Tablet',
    'ipad': 'iPad',
    'watch': 'Watch',
    'accessories-smart-watch': 'Smart Watch',
    'gadgets': 'Gadgets',
    'accessories': 'Accessories',
    'audio': 'Audio',
};

export default function CategoryPage() {
    const { slug } = useParams();
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/products?category=${slug}`);
                const data = await res.json();
                if (Array.isArray(data)) {
                    setProducts(data);
                } else {
                    setProducts([]);
                    setError(data.error || 'Failed to load products');
                }
            } catch (err) {
                setError('Failed to fetch products');
            } finally {
                setLoading(false);
            }
        };
        if (slug) fetchProducts();
    }, [slug]);

    const categoryTitle = categoryNames[slug as string] || (slug as string || '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    return (
        <div className="bg-gray-50 min-h-screen pb-20">
            <div className="container mx-auto px-4 py-12">
                {/* Breadcrumb */}
                <div className="flex gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 mb-8">
                    <Link href="/" className="hover:text-secondary">Home</Link>
                    <span>/</span>
                    <Link href="/categories" className="hover:text-secondary">Categories</Link>
                    <span>/</span>
                    <span className="text-secondary">{categoryTitle}</span>
                </div>

                <div className="flex items-center justify-between mb-10">
                    <div>
                        <h1 className="text-3xl font-black text-secondary uppercase tracking-widest flex items-center gap-3">
                            <span className="w-2 h-10 bg-primary rounded-full"></span>
                            {categoryTitle}
                        </h1>
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2 ml-5">
                            {products.length} Product{products.length !== 1 ? 's' : ''} Found
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="py-20 text-center font-black text-secondary animate-pulse">Loading products...</div>
                ) : error ? (
                    <div className="py-20 text-center text-red-500 font-bold">{error}</div>
                ) : products.length === 0 ? (
                    <div className="bg-white p-20 rounded-[40px] shadow-lg text-center border border-gray-100">
                        <div className="text-6xl mb-6">📦</div>
                        <h2 className="text-2xl font-black text-secondary uppercase tracking-widest mb-4">No Products Found</h2>
                        <p className="text-gray-400 mb-8 max-w-sm mx-auto text-sm">We don't have products in this category yet. Check back soon!</p>
                        <Link href="/" className="bg-primary text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/30 hover:bg-orange-600 transition-all">
                            Back to Home
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {products.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
