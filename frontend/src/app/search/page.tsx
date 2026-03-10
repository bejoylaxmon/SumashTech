'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import { API_BASE } from '@/lib/api';
import { SearchX } from 'lucide-react';

interface Product {
    id: number;
    name: string;
    slug: string;
    price: number;
    discount?: number;
    images: string[];
    isNew?: boolean;
    category: { name: string };
}

export default function SearchResultsPage() {
    const searchParams = useSearchParams();
    const query = searchParams.get('q');

    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSearchResults = async () => {
            if (!query) {
                setProducts([]);
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                // Fetch products with the search query
                const res = await fetch(`${API_BASE}/api/products?search=${encodeURIComponent(query)}`);
                if (!res.ok) throw new Error('Failed to fetch search results');
                const data = await res.json();
                setProducts(data);
            } catch (err) {
                console.error("Search error:", err);
                setProducts([]);
            } finally {
                setLoading(false);
            }
        };

        fetchSearchResults();
    }, [query]);

    return (
        <main className="container mx-auto px-4 py-12">
                <div className="mb-10 text-center">
                    <h1 className="text-3xl font-black text-secondary tracking-widest uppercase mb-4">
                        Search Results
                    </h1>
                    {query ? (
                        <p className="text-gray-500 font-medium">
                            Showing results for <span className="text-primary font-bold">"{query}"</span>
                        </p>
                    ) : (
                        <p className="text-gray-500 font-medium">
                            Please enter a search term in the search bar above.
                        </p>
                    )}
                </div>

                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="animate-pulse bg-white rounded-[2rem] h-[400px] border border-gray-100 flex flex-col p-4">
                                <div className="bg-gray-200 h-48 rounded-2xl mb-4 w-full"></div>
                                <div className="bg-gray-200 h-4 rounded-full w-3/4 mb-3"></div>
                                <div className="bg-gray-200 h-4 rounded-full w-1/2 mb-auto"></div>
                                <div className="bg-gray-200 h-10 rounded-xl w-full"></div>
                            </div>
                        ))}
                    </div>
                ) : products.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                        {products.map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                ) : (
<div className="text-center py-20 bg-white rounded-[3rem] shadow-sm border border-gray-100 mx-auto max-w-2xl">
                        <div className="flex justify-center mb-6">
                            <SearchX className="w-16 h-16 text-gray-300" />
                        </div>
                        <h2 className="text-2xl font-black text-secondary uppercase tracking-widest mb-4">No Products Found</h2>
                        <p className="text-gray-400 mb-8 max-w-sm mx-auto text-sm">
                            We couldn't find any products matching "{query}". Try checking your spelling or using more general terms.
                        </p>
                    </div>
                )}
            </main>
    );
}
