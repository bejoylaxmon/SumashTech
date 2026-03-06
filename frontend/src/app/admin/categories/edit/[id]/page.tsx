'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { API_BASE } from '@/lib/api';

export default function EditCategoryPage() {
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();
    const params = useParams();
    const id = params.id;

    useEffect(() => {
        const fetchCategory = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/categories/${id}`);
                const data = await res.json();
                if (res.ok) {
                    setName(data.name);
                    setSlug(data.slug);
                } else {
                    setError('Failed to load category');
                }
            } catch (err) {
                setError('Error connecting to server');
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchCategory();
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        const user = JSON.parse(localStorage.getItem('user') || '{}');

        try {
            const res = await fetch(`${API_BASE}/api/categories/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-email': user.email
                },
                body: JSON.stringify({ name, slug }),
            });

            if (!res.ok) throw new Error('Failed to update category');
            router.push('/admin/categories');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-10 text-center font-bold">Loading...</div>;

    return (
        <div className="container mx-auto px-4 py-12">
            <h1 className="text-3xl font-bold mb-8 text-secondary">Edit Category</h1>
            <form onSubmit={handleSubmit} className="max-w-xl bg-white p-8 rounded-2xl shadow-lg space-y-4">
                {error && <div className="text-red-500 font-bold bg-red-50 p-3 rounded-lg">{error}</div>}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Category Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="w-full border rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Slug</label>
                    <input
                        type="text"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        required
                        className="w-full border rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                </div>
                <div className="flex flex-col sm:flex-row gap-4 pt-6">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="flex-1 bg-gray-200 text-secondary font-black py-5 rounded-2xl hover:bg-gray-300 transition-all uppercase tracking-widest text-xs border-2 border-gray-100"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex-[2] bg-primary text-white font-black py-5 px-10 rounded-2xl shadow-2xl shadow-primary/40 hover:bg-orange-600 transition-all disabled:opacity-50 uppercase tracking-widest text-xs border-2 border-white/20"
                    >
                        <span className="relative z-10">
                            {saving ? 'Saving Changes...' : 'Update Category Now'}
                        </span>
                    </button>
                </div>
            </form>
        </div>
    );
}
