'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { API_BASE } from '@/lib/api';
import ProductCard from '@/components/ProductCard';

export default function DealsPage() {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDeals = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/products`);
                const data = await res.json();
                if (Array.isArray(data)) {
                    // Filter products that have a discount > 0
                    const deals = data.filter((p: any) => p.discount && p.discount > 0);
                    setProducts(deals);
                } else {
                    setProducts([]);
                    setError(data.error || 'Failed to load deals');
                }
            } catch (err) {
                setError('Failed to fetch deals');
            } finally {
                setLoading(false);
            }
        };
        fetchDeals();
    }, []);

    return (
        <div className="bg-gray-50 min-h-screen pb-20">
            {/* Hero Banner */}
            <div className="bg-gradient-to-r from-primary to-orange-600 py-16">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-widest mb-4">
                        🔥 Hot Deals
                    </h1>
                    <p className="text-white/80 text-sm font-bold max-w-md mx-auto">
                        Save big on your favorite tech products. Limited time offers with massive discounts!
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-12">
                {/* Breadcrumb */}
                <div className="flex gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 mb-8">
                    <Link href="/" className="hover:text-secondary">Home</Link>
                    <span>/</span>
                    <span className="text-secondary">Deals</span>
                </div>

                <div className="flex items-center justify-between mb-10">
                    <h2 className="text-2xl font-black text-secondary uppercase tracking-widest flex items-center gap-3">
                        <span className="w-2 h-10 bg-primary rounded-full"></span>
                        Discounted Products
                    </h2>
                    <span className="bg-red-100 text-red-600 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">
                        {products.length} Deal{products.length !== 1 ? 's' : ''} Available
                    </span>
                </div>

                {loading ? (
                    <div className="py-20 text-center font-black text-secondary animate-pulse">Loading deals...</div>
                ) : error ? (
                    <div className="py-20 text-center text-red-500 font-bold">{error}</div>
                ) : products.length === 0 ? (
                    <div className="bg-white p-20 rounded-[40px] shadow-lg text-center border border-gray-100">
                        <div className="text-6xl mb-6">🏷️</div>
                        <h2 className="text-2xl font-black text-secondary uppercase tracking-widest mb-4">No Deals Right Now</h2>
                        <p className="text-gray-400 mb-8 max-w-sm mx-auto text-sm">Check back soon for amazing deals and discounts on premium tech products.</p>
                        <Link href="/" className="bg-primary text-black px-10 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/30 hover:bg-orange-600 transition-all">
                            Start Shopping
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
