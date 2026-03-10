'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { API_BASE } from '@/lib/api';

export default function AdminCategoriesPage() {
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { user } = useAuth();

    const fetchCategories = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/categories`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setCategories(data);
            } else {
                setCategories([]);
                setError(data.error || 'Invalid response from server');
            }
        } catch (err) {
            setError('Failed to fetch categories');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const deleteCategory = async (id: number) => {
        if (!confirm('Are you sure? This may affect products in this category.')) return;

        try {
            const res = await fetch(`${API_BASE}/api/categories/${id}`, {
                method: 'DELETE',
                headers: { 'x-user-email': user?.email || '' }
            });
            if (res.ok) {
                setCategories(categories.filter(c => c.id !== id));
            }
        } catch (err) {
            alert('Error deleting category');
        }
    };

    const canManage = user?.permissions?.includes('manage_inventory') || user?.permissions?.includes('manage_coupons') || user?.role === 'SUPER_ADMIN';

    if (loading) return <div className="p-10 text-center font-bold">Loading Categories...</div>;

    return (
        <div className="container mx-auto px-4 py-12">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-secondary">Manage Categories</h1>
                {canManage && (
                    <Link href="/admin/categories/add" className="bg-primary text-black px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/30 hover:bg-orange-600 transition-all border-2 border-white/20">
                        + Add Category Now
                    </Link>
                )}
            </div>

            {error && <div className="text-red-500 mb-4">{error}</div>}

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden max-w-2xl">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-6 py-4 text-sm font-bold text-gray-700">Name</th>
                            <th className="px-6 py-4 text-sm font-bold text-gray-700">Slug</th>
                            {canManage && <th className="px-6 py-4 text-sm font-bold text-gray-700 text-right">Actions</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {categories.map((cat) => (
                            <tr key={cat.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-bold text-secondary">{cat.name}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">{cat.slug}</td>
                                {canManage && (
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-3 min-w-max">
                                            <Link
                                                href={`/admin/categories/edit/${cat.id}`}
                                                className="bg-blue-600 text-black px-4 py-2 rounded-lg font-black text-xs uppercase tracking-wider hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20"
                                            >
                                                Edit
                                            </Link>
                                            <button
                                                onClick={() => deleteCategory(cat.id)}
                                                className="bg-red-500 text-black px-4 py-2 rounded-lg font-black text-xs uppercase tracking-wider hover:bg-red-700 transition-all shadow-md shadow-red-500/20"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
