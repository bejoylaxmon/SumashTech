'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { API_BASE } from '@/lib/api';
import { Plus, Trash2, Upload, Loader2 } from 'lucide-react';

interface Variant {
    type: string;
    value: string;
    price: string;
    stock: string;
    images?: string[];
}

interface Specification {
    key: string;
    value: string;
}

export default function AddProductPage() {
    const router = useRouter();
    const { user } = useAuth();
    
    const isAuthorized = useMemo(() => 
        user?.role === 'SUPER_ADMIN' || 
        user?.role === 'ADMIN' || 
        user?.role === 'MANAGER' || 
        user?.permissions?.includes('edit_product_full') ||
        user?.permissions?.includes('manage_inventory'),
        [user]
    );

    useEffect(() => {
        if (user && !isAuthorized) {
            router.push('/');
        }
    }, [user, isAuthorized, router]);

    if (!isAuthorized && user) return <div className="p-10 text-center text-secondary font-bold">Access Denied</div>;

    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [slugEdited, setSlugEdited] = useState(false);
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [discount, setDiscount] = useState('');
    const [stock, setStock] = useState('');
    const [images, setImages] = useState<string[]>(['']);
    const [uploadingImages, setUploadingImages] = useState<number[]>([]);
    const [categoryId, setCategoryId] = useState('');
    const [brandId, setBrandId] = useState('');
    const [categories, setCategories] = useState<any[]>([]);
    const [brands, setBrands] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // New fields
    const [sku, setSku] = useState('');
    const [bookingMoney, setBookingMoney] = useState('');
    const [purchasePoints, setPurchasePoints] = useState('');
    const [warranty, setWarranty] = useState('');
    const [condition, setCondition] = useState('');
    const [isFeatured, setIsFeatured] = useState(false);
    const [isNew, setIsNew] = useState(false);
    const [peopleViewing, setPeopleViewing] = useState('');

    // Variants
    const [storageVariants, setStorageVariants] = useState<Variant[]>([{ type: 'storage', value: '', price: '', stock: '' }]);
    const [colorVariants, setColorVariants] = useState<Variant[]>([{ type: 'color', value: '', price: '', stock: '', images: [''] }]);
    const [regionVariants, setRegionVariants] = useState<Variant[]>([{ type: 'region', value: '', price: '', stock: '' }]);

    // Specifications
    const [specifications, setSpecifications] = useState<Specification[]>([
        { key: 'Display', value: '' },
        { key: 'Processor', value: '' },
        { key: 'Camera', value: '' },
        { key: 'Battery', value: '' },
        { key: 'Network', value: '' },
        { key: 'Memory', value: '' },
        { key: 'OS', value: '' },
        { key: 'Connectivity', value: '' },
    ]);

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
        const fetchData = async () => {
            const [catRes, brandRes] = await Promise.all([
                fetch(`${API_BASE}/api/categories`),
                fetch(`${API_BASE}/api/brands`)
            ]);
            const [cats, brds] = await Promise.all([catRes.json(), brandRes.json()]);
            setCategories(cats);
            setBrands(brds || []);
        };
        fetchData();
    }, []);

    const addImageField = () => setImages([...images, '']);
    const updateImage = (index: number, val: string) => {
        const newImages = [...images];
        newImages[index] = val;
        setImages(newImages);
    };
    const removeImage = (index: number) => {
        if (images.length > 1) {
            setImages(images.filter((_, i) => i !== index));
        }
    };

    const handleImageUpload = async (index: number, file: File) => {
        if (!file) return;
        
        setUploadingImages(prev => [...prev, index]);
        
        try {
            const formData = new FormData();
            formData.append('image', file);
            
            const res = await fetch(`${API_BASE}/api/upload/image`, {
                method: 'POST',
                body: formData
            });
            
            if (!res.ok) throw new Error('Upload failed');
            
            const data = await res.json();
            updateImage(index, data.url);
        } catch (err) {
            console.error('Image upload error:', err);
            alert('Failed to upload image');
        } finally {
            setUploadingImages(prev => prev.filter(i => i !== index));
        }
    };

    const updateVariant = (type: 'storage' | 'color' | 'region', index: number, field: string, value: string) => {
        const update = (variants: Variant[]) => {
            const newVariants = [...variants];
            newVariants[index] = { ...newVariants[index], [field]: value };
            return newVariants;
        };
        if (type === 'storage') setStorageVariants(update(storageVariants));
        else if (type === 'color') setColorVariants(update(colorVariants));
        else setRegionVariants(update(regionVariants));
    };

    const addVariant = (type: 'storage' | 'color' | 'region') => {
        const newVariant = { type, value: '', price: '', stock: '' };
        if (type === 'storage') setStorageVariants([...storageVariants, newVariant]);
        else if (type === 'color') setColorVariants([...colorVariants, newVariant]);
        else setRegionVariants([...regionVariants, newVariant]);
    };

    const updateColorImages = (index: number, images: string[]) => {
        const newVariants = [...colorVariants];
        newVariants[index] = { ...newVariants[index], images };
        setColorVariants(newVariants);
    };

    const handleColorImageUpload = async (variantIndex: number, imgIndex: number, file: File) => {
        if (!file) return;
        try {
            const formData = new FormData();
            formData.append('image', file);
            const res = await fetch(`${API_BASE}/api/upload/image`, { method: 'POST', body: formData });
            if (!res.ok) throw new Error('Upload failed');
            const data = await res.json();
            
            const currentImages = colorVariants[variantIndex].images || [''];
            const newImages = [...currentImages];
            newImages[imgIndex] = data.url;
            updateColorImages(variantIndex, newImages);
        } catch (err) {
            alert('Failed to upload image');
        }
    };

    const removeVariant = (type: 'storage' | 'color' | 'region', index: number) => {
        if (type === 'storage' && storageVariants.length > 1) {
            setStorageVariants(storageVariants.filter((_, i) => i !== index));
        } else if (type === 'color' && colorVariants.length > 1) {
            setColorVariants(colorVariants.filter((_, i) => i !== index));
        } else if (type === 'region' && regionVariants.length > 1) {
            setRegionVariants(regionVariants.filter((_, i) => i !== index));
        }
    };

    const updateSpec = (index: number, value: string) => {
        const newSpecs = [...specifications];
        newSpecs[index] = { ...newSpecs[index], value };
        setSpecifications(newSpecs);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const user = JSON.parse(localStorage.getItem('user') || '{}');

        const variants = [
            ...storageVariants.filter(v => v.value.trim()),
            ...colorVariants.filter(v => v.value.trim()),
            ...regionVariants.filter(v => v.value.trim())
        ];

        const specsObj: Record<string, string> = {};
        specifications.forEach(spec => {
            if (spec.value.trim()) {
                specsObj[spec.key] = spec.value;
            }
        });

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
                    discount: parseFloat(discount) || 0,
                    stock: parseInt(stock),
                    categoryId: parseInt(categoryId),
                    brandId: brandId ? parseInt(brandId) : null,
                    images: images.filter(img => img.trim() !== ''),
                    sku,
                    bookingMoney: parseFloat(bookingMoney) || 0,
                    purchasePoints: parseInt(purchasePoints) || 0,
                    warranty,
                    condition,
                    isFeatured,
                    isNew,
                    peopleViewing: parseInt(peopleViewing) || 0,
                    variants: variants.map(v => ({
                        type: v.type,
                        value: v.value,
                        price: parseFloat(v.price) || 0,
                        stock: parseInt(v.stock) || 0
                    })),
                    specifications: Object.keys(specsObj).length > 0 ? specsObj : null
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to add product');
            }
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
            <form onSubmit={handleSubmit} className="space-y-8">
                {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl">{error}</div>}

                {/* Basic Info */}
                <div className="bg-white p-8 rounded-2xl shadow-lg space-y-6">
                    <h2 className="text-xl font-black text-secondary uppercase tracking-wider border-b pb-4">Basic Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Product Name *</label>
                            <input type="text" value={name} onChange={(e) => handleNameChange(e.target.value)} required className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 focus:border-primary transition-all font-bold" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Slug (auto-generated)</label>
                            <input type="text" value={slug} onChange={(e) => handleSlugChange(e.target.value)} className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 focus:border-primary transition-all font-bold" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 focus:border-primary transition-all" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Category *</label>
                            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 focus:border-primary transition-all">
                                <option value="">Select Category</option>
                                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Brand</label>
                            <select value={brandId} onChange={(e) => setBrandId(e.target.value)} className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 focus:border-primary transition-all">
                                <option value="">Select Brand</option>
                                {brands.map(brand => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Pricing & Stock */}
                <div className="bg-white p-8 rounded-2xl shadow-lg space-y-6">
                    <h2 className="text-xl font-black text-secondary uppercase tracking-wider border-b pb-4">Pricing & Stock</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Price *</label>
                            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 focus:border-primary transition-all font-bold" placeholder="৳" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Discount %</label>
                            <input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 focus:border-primary transition-all" placeholder="0" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Stock *</label>
                            <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} required className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 focus:border-primary transition-all" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">SKU</label>
                            <input type="text" value={sku} onChange={(e) => setSku(e.target.value)} className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 focus:border-primary transition-all" />
                        </div>
                    </div>
                </div>

                {/* Additional Info */}
                <div className="bg-white p-8 rounded-2xl shadow-lg space-y-6">
                    <h2 className="text-xl font-black text-secondary uppercase tracking-wider border-b pb-4">Additional Information</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Booking Money</label>
                            <input type="number" value={bookingMoney} onChange={(e) => setBookingMoney(e.target.value)} className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 focus:border-primary transition-all" placeholder="৳" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Purchase Points</label>
                            <input type="number" value={purchasePoints} onChange={(e) => setPurchasePoints(e.target.value)} className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 focus:border-primary transition-all" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Warranty</label>
                            <input type="text" value={warranty} onChange={(e) => setWarranty(e.target.value)} className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 focus:border-primary transition-all" placeholder="2 Years Service Warranty" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Condition</label>
                            <select value={condition} onChange={(e) => setCondition(e.target.value)} className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 focus:border-primary transition-all">
                                <option value="">Select</option>
                                <option value="Brand New">Brand New</option>
                                <option value="Used">Used</option>
                                <option value="Refurbished">Refurbished</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">People Viewing</label>
                            <input type="number" value={peopleViewing} onChange={(e) => setPeopleViewing(e.target.value)} className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 focus:border-primary transition-all" />
                        </div>
                        <div className="flex items-center gap-6 pt-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary" />
                                <span className="font-bold text-gray-700">Featured</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={isNew} onChange={(e) => setIsNew(e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary" />
                                <span className="font-bold text-gray-700">New Arrival</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Variants Section */}
                <div className="bg-white p-8 rounded-2xl shadow-lg space-y-6">
                    <h2 className="text-xl font-black text-secondary uppercase tracking-wider border-b pb-4">Product Variants</h2>
                    
                    <div className="space-y-8">
                        {/* Storage Variants */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-gray-700">Storage Options</h3>
                                <button type="button" onClick={() => addVariant('storage')} className="text-primary text-sm font-bold flex items-center gap-1"><Plus className="w-4 h-4" /> Add</button>
                            </div>
                            <div className="space-y-3">
                                {storageVariants.map((variant, idx) => (
                                    <div key={idx} className="flex gap-3 items-center">
                                        <input type="text" placeholder="e.g., 256GB" value={variant.value} onChange={(e) => updateVariant('storage', idx, 'value', e.target.value)} className="flex-1 border-2 border-gray-100 rounded-xl px-4 py-2 focus:border-primary transition-all" />
                                        <input type="number" placeholder="Price (৳)" value={variant.price} onChange={(e) => updateVariant('storage', idx, 'price', e.target.value)} className="w-32 border-2 border-gray-100 rounded-xl px-4 py-2 focus:border-primary transition-all" />
                                        <input type="number" placeholder="Stock" value={variant.stock} onChange={(e) => updateVariant('storage', idx, 'stock', e.target.value)} className="w-24 border-2 border-gray-100 rounded-xl px-4 py-2 focus:border-primary transition-all" />
                                        <button type="button" onClick={() => removeVariant('storage', idx)} className="text-red-500 p-2"><Trash2 className="w-5 h-5" /></button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Color Variants */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-gray-700">Color Options</h3>
                                <button type="button" onClick={() => addVariant('color')} className="text-primary text-sm font-bold flex items-center gap-1"><Plus className="w-4 h-4" /> Add</button>
                            </div>
                            <div className="space-y-4">
                                {colorVariants.map((variant, idx) => (
                                    <div key={idx} className="border-2 border-gray-100 rounded-xl p-4">
                                        <div className="flex gap-3 items-center mb-3">
                                            <input type="text" placeholder="e.g., Cosmic Orange" value={variant.value} onChange={(e) => updateVariant('color', idx, 'value', e.target.value)} className="flex-1 border-2 border-gray-100 rounded-xl px-4 py-2 focus:border-primary transition-all" />
                                            <input type="number" placeholder="Extra Price (৳)" value={variant.price} onChange={(e) => updateVariant('color', idx, 'price', e.target.value)} className="w-32 border-2 border-gray-100 rounded-xl px-4 py-2 focus:border-primary transition-all" />
                                            <input type="number" placeholder="Stock" value={variant.stock} onChange={(e) => updateVariant('color', idx, 'stock', e.target.value)} className="w-24 border-2 border-gray-100 rounded-xl px-4 py-2 focus:border-primary transition-all" />
                                            <button type="button" onClick={() => removeVariant('color', idx)} className="text-red-500 p-2"><Trash2 className="w-5 h-5" /></button>
                                        </div>
                                        {/* Color Images */}
                                        <div className="pl-4 border-l-2 border-gray-100">
                                            <p className="text-xs font-bold text-gray-500 mb-2">Color Images (optional)</p>
                                            <div className="space-y-2">
                                                {(variant.images || ['']).map((img, imgIdx) => (
                                                    <div key={imgIdx} className="flex gap-2 items-center">
                                                        <input 
                                                            type="text" 
                                                            value={img} 
                                                            onChange={(e) => {
                                                                const newImages = [...(variant.images || [''])];
                                                                newImages[imgIdx] = e.target.value;
                                                                updateColorImages(idx, newImages);
                                                            }}
                                                            placeholder="Image URL" 
                                                            className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
                                                        />
                                                        <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 p-1.5 rounded-lg">
                                                            <Upload className="w-4 h-4 text-gray-600" />
                                                            <input 
                                                                type="file" 
                                                                accept="image/*" 
                                                                className="hidden" 
                                                                onChange={(e) => e.target.files?.[0] && handleColorImageUpload(idx, imgIdx, e.target.files[0])}
                                                            />
                                                        </label>
                                                        {(variant.images || ['']).length > 1 && (
                                                            <button 
                                                                type="button" 
                                                                onClick={() => {
                                                                    const newImages = (variant.images || ['']).filter((_, i) => i !== imgIdx);
                                                                    updateColorImages(idx, newImages);
                                                                }}
                                                                className="text-red-500 p-1"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                            <button 
                                                type="button" 
                                                onClick={() => updateColorImages(idx, [...(variant.images || []), ''])}
                                                className="text-xs text-primary font-bold mt-2"
                                            >
                                                + Add Image
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Region Variants */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-gray-700">Region Options</h3>
                                <button type="button" onClick={() => addVariant('region')} className="text-primary text-sm font-bold flex items-center gap-1"><Plus className="w-4 h-4" /> Add</button>
                            </div>
                            <div className="space-y-3">
                                {regionVariants.map((variant, idx) => (
                                    <div key={idx} className="flex gap-3 items-center">
                                        <input type="text" placeholder="e.g., Japan" value={variant.value} onChange={(e) => updateVariant('region', idx, 'value', e.target.value)} className="flex-1 border-2 border-gray-100 rounded-xl px-4 py-2 focus:border-primary transition-all" />
                                        <input type="number" placeholder="Extra Price (৳)" value={variant.price} onChange={(e) => updateVariant('region', idx, 'price', e.target.value)} className="w-32 border-2 border-gray-100 rounded-xl px-4 py-2 focus:border-primary transition-all" />
                                        <input type="number" placeholder="Stock" value={variant.stock} onChange={(e) => updateVariant('region', idx, 'stock', e.target.value)} className="w-24 border-2 border-gray-100 rounded-xl px-4 py-2 focus:border-primary transition-all" />
                                        <button type="button" onClick={() => removeVariant('region', idx)} className="text-red-500 p-2"><Trash2 className="w-5 h-5" /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Specifications Section */}
                <div className="bg-white p-8 rounded-2xl shadow-lg space-y-6">
                    <h2 className="text-xl font-black text-secondary uppercase tracking-wider border-b pb-4">Specifications</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {specifications.map((spec, idx) => (
                            <div key={spec.key} className="flex gap-3 items-center">
                                <label className="w-32 font-bold text-gray-700">{spec.key}</label>
                                <input type="text" placeholder={`Enter ${spec.key}`} value={spec.value} onChange={(e) => updateSpec(idx, e.target.value)} className="flex-1 border-2 border-gray-100 rounded-xl px-4 py-2 focus:border-primary transition-all" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Images */}
                <div className="bg-white p-8 rounded-2xl shadow-lg space-y-6">
                    <h2 className="text-xl font-black text-secondary uppercase tracking-wider border-b pb-4">Product Images</h2>
                    <div className="space-y-3">
                        {images.map((img, idx) => (
                            <div key={idx} className="flex gap-3 items-center">
                                <input 
                                    type="text" 
                                    value={img} 
                                    onChange={(e) => updateImage(idx, e.target.value)} 
                                    placeholder="https://example.com/image.jpg" 
                                    className="flex-1 border-2 border-gray-100 rounded-xl px-4 py-3 focus:border-primary transition-all" 
                                />
                                <label className={`cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-xl transition-all flex items-center gap-2 ${uploadingImages.includes(idx) ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                    {uploadingImages.includes(idx) ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Upload className="w-5 h-5" />
                                    )}
                                    <span className="text-sm font-bold">Upload</span>
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        className="hidden" 
                                        onChange={(e) => e.target.files?.[0] && handleImageUpload(idx, e.target.files[0])}
                                        disabled={uploadingImages.includes(idx)}
                                    />
                                </label>
                                <button type="button" onClick={() => removeImage(idx)} className="text-red-500 p-2 hover:bg-red-50 rounded-xl transition-all"><Trash2 className="w-5 h-5" /></button>
                            </div>
                        ))}
                    </div>
                    <button type="button" onClick={addImageField} className="text-primary font-bold flex items-center gap-1"><Plus className="w-5 h-5" /> Add Another Image</button>
                </div>

                <button type="submit" disabled={loading} className="w-full bg-primary text-black font-black py-5 rounded-[2rem] shadow-2xl shadow-primary/40 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-[0.2em] text-sm border border-white/10 disabled:opacity-50">
                    {loading ? 'Adding Product...' : 'Add Product'}
                </button>
            </form>
        </div>
    );
}
