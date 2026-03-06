'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { API_BASE } from '@/lib/api';

export default function AdminProductsPage() {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { user } = useAuth();

    const fetchProducts = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/products`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setProducts(data);
            } else {
                setProducts([]);
                setError(data.error || 'Invalid response from server');
            }
        } catch (err) {
            setError('Failed to fetch products');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const deleteProduct = async (id: number) => {
        if (!confirm('Are you sure you want to delete this product?')) return;

        try {
            const res = await fetch(`${API_BASE}/api/products/${id}`, {
                method: 'DELETE',
                headers: { 'x-user-email': user?.email || '' }
            });
            if (res.ok) {
                setProducts(products.filter(p => p.id !== id));
            } else {
                alert('Failed to delete product');
            }
        } catch (err) {
            alert('Error deleting product');
        }
    };

    if (loading) return <div className="p-10 text-center text-secondary font-bold">Loading Products...</div>;

    return (
        <div className="container mx-auto px-4 py-12">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-secondary">Manage Products</h1>
                <Link href="/admin/products/add" className="bg-primary text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-primary/40 hover:bg-orange-600 transition-all border-2 border-white/20">
                    + Add Product Now
                </Link>
            </div>

            {error && <div className="text-red-500 mb-4">{error}</div>}

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-6 py-4 text-sm font-bold text-gray-700">Name</th>
                            <th className="px-6 py-4 text-sm font-bold text-gray-700">Category</th>
                            <th className="px-6 py-4 text-sm font-bold text-gray-700">Price</th>
                            <th className="px-6 py-4 text-sm font-bold text-gray-700">Stock</th>
                            <th className="px-6 py-4 text-sm font-bold text-gray-700 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {products.map((product) => (
                            <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-secondary">{product.name}</div>
                                    <div className="text-xs text-gray-400">{product.slug}</div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">{product.category?.name}</td>
                                <td className="px-6 py-4 text-sm font-bold text-primary">৳{product.price}</td>
                                <td className="px-6 py-4 text-sm">
                                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${product.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {product.stock} in stock
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-3 min-w-max">
                                        <Link href={`/admin/products/edit/${product.id}`} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-600/30 transition-all border-2 border-white/10">
                                            Edit
                                        </Link>
                                        <button onClick={() => deleteProduct(product.id)} className="bg-red-500 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 shadow-lg shadow-red-500/30 transition-all border-2 border-white/10">
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
