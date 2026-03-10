'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE } from '@/lib/api';

export default function AddCategoryPage() {
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [parentId, setParentId] = useState('');
    const [categories, setCategories] = useState<{id: number; name: string; slug: string}[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    useEffect(() => {
        fetch(`${API_BASE}/api/categories`)
            .then(res => res.json())
            .then(data => setCategories(data))
            .catch(console.error);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const user = JSON.parse(localStorage.getItem('user') || '{}');

        try {
            const res = await fetch(`${API_BASE}/api/categories`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-email': user.email
                },
                body: JSON.stringify({ 
                    name, 
                    slug, 
                    parentId: parentId ? parseInt(parentId) : null 
                }),
            });

            if (!res.ok) throw new Error('Failed to add category');
            router.push('/admin/categories');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-12">
            <h1 className="text-3xl font-black mb-8 text-secondary uppercase tracking-tighter">Add New Category</h1>
            <form onSubmit={handleSubmit} className="max-w-xl bg-white p-10 rounded-[2.5rem] shadow-2xl space-y-6 border border-gray-50">
                {error && <div className="bg-red-50 text-red-500 p-4 rounded-2xl text-sm font-bold border border-red-100">{error}</div>}
                <div>
                    <label className="block text-xs font-black text-gray-400 mb-2 uppercase tracking-widest">Category Name</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
                        className="w-full border-2 border-gray-100 rounded-2xl px-5 py-3.5 focus:border-primary transition-all font-bold text-secondary outline-none" />
                </div>
                <div>
                    <label className="block text-xs font-black text-gray-400 mb-2 uppercase tracking-widest">Slug</label>
                    <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} required
                        className="w-full border-2 border-gray-100 rounded-2xl px-5 py-3.5 focus:border-primary transition-all font-bold text-secondary outline-none" />
                </div>
                <div>
                    <label className="block text-xs font-black text-gray-400 mb-2 uppercase tracking-widest">Parent Category</label>
                    <select value={parentId} onChange={(e) => setParentId(e.target.value)}
                        className="w-full border-2 border-gray-100 rounded-2xl px-5 py-3.5 focus:border-primary transition-all font-bold text-secondary outline-none">
                        <option value="">No Parent (Top Level)</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                </div>
                <button type="submit" disabled={loading}
                    className="w-full bg-primary text-black font-black py-5 rounded-[2rem] shadow-2xl shadow-primary/40 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-[0.2em] text-sm mt-4 border border-white/10">
                    {loading ? 'Adding Category...' : 'Add Category Now'}
                </button>
            </form>
        </div>
    );
}
