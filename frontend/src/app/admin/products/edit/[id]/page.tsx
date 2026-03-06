'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { API_BASE } from '@/lib/api';

export default function EditProductPage() {
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [stock, setStock] = useState('');
    const [images, setImages] = useState<string[]>(['']);
    const [categoryId, setCategoryId] = useState('');
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();
    const params = useParams();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [pRes, cRes] = await Promise.all([
                    fetch(`${API_BASE}/api/products/${params.id}`),
                    fetch(`${API_BASE}/api/categories`)
                ]);
                const product = await pRes.json();
                const cats = await cRes.json();

                setName(product.name);
                setSlug(product.slug);
                setDescription(product.description || '');
                setPrice(product.price.toString());
                setStock(product.stock.toString());
                setImages(product.images && product.images.length > 0 ? product.images : ['']);
                setCategoryId(product.categoryId.toString());
                setCategories(cats);
            } catch (err) {
                setError('Failed to load product data');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [params.id]);

    const addImageField = () => setImages([...images, '']);
    const updateImage = (index: number, val: string) => {
        const newImages = [...images];
        newImages[index] = val;
        setImages(newImages);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        const user = JSON.parse(localStorage.getItem('user') || '{}');

        try {
            const res = await fetch(`${API_BASE}/api/products/${params.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-email': user.email
                },
                body: JSON.stringify({
                    name, slug, description,
                    price: parseFloat(price),
                    stock: parseInt(stock),
                    categoryId: parseInt(categoryId),
                    images: images.filter(img => img.trim() !== '')
                }),
            });

            if (!res.ok) throw new Error('Failed to update product');
            router.push('/admin/products');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-10 text-center font-black">Loading Product Data...</div>;

    return (
        <div className="container mx-auto px-4 py-12">
            <h1 className="text-3xl font-black mb-8 text-secondary uppercase tracking-tighter">Edit Product</h1>
            <form onSubmit={handleSubmit} className="max-w-xl bg-white p-10 rounded-[2.5rem] shadow-2xl space-y-6 border border-gray-50">
                {error && <div className="bg-red-50 text-red-500 p-4 rounded-2xl text-sm font-bold border border-red-100">{error}</div>}

                <div>
                    <label className="block text-xs font-black text-gray-400 mb-2 uppercase tracking-widest">Product Name</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
                        className="w-full border-2 border-gray-100 rounded-2xl px-5 py-3.5 focus:border-primary transition-all font-bold text-secondary" />
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-black text-gray-400 mb-2 uppercase tracking-widest">Price (৳)</label>
                        <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required
                            className="w-full border-2 border-gray-100 rounded-2xl px-5 py-3.5 focus:border-primary transition-all font-bold text-primary" />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-gray-400 mb-2 uppercase tracking-widest">Stock</label>
                        <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} required
                            className="w-full border-2 border-gray-100 rounded-2xl px-5 py-3.5 focus:border-primary transition-all font-bold text-secondary" />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-black text-gray-400 mb-2 uppercase tracking-widest">Category</label>
                    <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required
                        className="w-full border-2 border-gray-100 rounded-2xl px-5 py-3.5 focus:border-primary transition-all font-bold text-secondary appearance-none">
                        <option value="">Select Category</option>
                        {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-black text-gray-400 mb-2 uppercase tracking-widest">Images (URLs)</label>
                    <div className="space-y-3">
                        {images.map((img, idx) => (
                            <input
                                key={idx}
                                type="text"
                                value={img}
                                onChange={(e) => updateImage(idx, e.target.value)}
                                className="w-full border-2 border-gray-100 rounded-2xl px-5 py-3 focus:border-primary transition-all text-sm font-medium"
                            />
                        ))}
                    </div>
                    <button type="button" onClick={addImageField} className="mt-3 text-[10px] font-black text-primary uppercase tracking-[0.2em] hover:opacity-70 transition-opacity">
                        + Add More Images
                    </button>
                </div>

                <button type="submit" disabled={saving}
                    className="w-full bg-secondary text-white font-black py-5 rounded-[2rem] shadow-2xl shadow-secondary/40 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-[0.2em] text-sm mt-8 border border-white/10">
                    {saving ? 'Saving Changes...' : 'Update Product Now'}
                </button>
            </form>
        </div>
    );
}
