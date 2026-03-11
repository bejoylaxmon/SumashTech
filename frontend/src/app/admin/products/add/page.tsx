'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE } from '@/lib/api';

export default function AddProductPage() {
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [slugEdited, setSlugEdited] = useState(false);
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [stock, setStock] = useState('');
    const [images, setImages] = useState<string[]>(['']);
    const [categoryId, setCategoryId] = useState('');
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const generateSlug = (text: string) => {
        return text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    };

    const handleNameChange = (value: string) => {
        setName(value);
        if (!slugEdited) {
            setSlug(generateSlug(value));
        }
    };

    const handleSlugChange = (value: string) => {
        setSlug(value);
        setSlugEdited(true);
    };

    useEffect(() => {
        const fetchCategories = async () => {
            const res = await fetch(`${API_BASE}/api/categories`);
            const data = await res.json();
            setCategories(data);
        };
        fetchCategories();
    }, []);

    const addImageField = () => setImages([...images, '']);
    const updateImage = (index: number, val: string) => {
        const newImages = [...images];
        newImages[index] = val;
        setImages(newImages);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const user = JSON.parse(localStorage.getItem('user') || '{}');

        try {
            const res = await fetch(`${API_BASE}/api/products`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-email': user.email
                },
                body: JSON.stringify({
                    name,
                    slug,
                    description,
                    price: parseFloat(price),
                    stock: parseInt(stock),
                    categoryId: parseInt(categoryId),
                    images: images.filter(img => img.trim() !== '')
                }),
            });

            if (!res.ok) throw new Error('Failed to add product');
            router.push('/admin/products');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-12">
            <h1 className="text-3xl font-bold mb-8 text-secondary">Add New Product</h1>
            <form onSubmit={handleSubmit} className="max-w-xl bg-white p-8 rounded-2xl shadow-lg space-y-4">
                {error && <div className="text-red-500">{error}</div>}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Product Name</label>
                    <input type="text" value={name} onChange={(e) => handleNameChange(e.target.value)} required className="w-full border rounded-xl px-4 py-2" />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Slug (auto-generated)</label>
                    <input type="text" value={slug} onChange={(e) => handleSlugChange(e.target.value)} 
                        placeholder="Auto-generated from name"
                        className="w-full border rounded-xl px-4 py-2" />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border rounded-xl px-4 py-2" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Price</label>
                        <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required className="w-full border rounded-xl px-4 py-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Stock</label>
                        <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} required className="w-full border rounded-xl px-4 py-2" />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Category</label>
                    <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required className="w-full border rounded-xl px-4 py-2">
                        <option value="">Select Category</option>
                        {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-black text-gray-700 mb-2 uppercase tracking-wide">Product Images (URLs)</label>
                    <div className="space-y-2">
                        {images.map((img, idx) => (
                            <input
                                key={idx}
                                type="text"
                                value={img}
                                onChange={(e) => updateImage(idx, e.target.value)}
                                placeholder="https://example.com/image.jpg"
                                className="w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 focus:border-primary transition-all text-sm"
                            />
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={addImageField}
                        className="mt-3 text-xs font-black text-primary hover:underline uppercase tracking-widest"
                    >
                        + Add Another Image URL
                    </button>
                </div>
                <button type="submit" disabled={loading} className="w-full bg-primary text-black font-black py-5 rounded-[2rem] shadow-2xl shadow-primary/40 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-[0.2em] text-sm border border-white/10">
                    {loading ? 'Adding Product...' : 'Add Product'}
                </button>
            </form>
        </div>
    );
}
