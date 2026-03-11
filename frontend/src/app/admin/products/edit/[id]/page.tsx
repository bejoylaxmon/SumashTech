'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { API_BASE } from '@/lib/api';
import { Plus, Trash2, Upload, Loader2, ChevronDown, ChevronUp, Image as ImageIcon } from 'lucide-react';

interface Variant {
    id?: number;
    type: string;
    value: string;
    price: string;
    stock: string;
    images?: string[];
}

interface SpecificationSection {
    id?: number;
    title: string;
    items: { id?: number; key: string; value: string }[];
}

export default function EditProductPage() {
    const router = useRouter();
    const params = useParams();
    const { user } = useAuth();
    
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
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
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
    const [storageVariants, setStorageVariants] = useState<Variant[]>([]);
    const [colorVariants, setColorVariants] = useState<Variant[]>([]);
    const [regionVariants, setRegionVariants] = useState<Variant[]>([]);

    // Specifications
    const [specSections, setSpecSections] = useState<SpecificationSection[]>([]);

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

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [pRes, cRes, bRes] = await Promise.all([
                    fetch(`${API_BASE}/api/products/${params.id}`),
                    fetch(`${API_BASE}/api/categories`),
                    fetch(`${API_BASE}/api/brands`)
                ]);
                const product = await pRes.json();
                const cats = await cRes.json();
                const brds = await bRes.json();

                setName(product.name || '');
                setSlug(product.slug || '');
                setDescription(product.description || '');
                setPrice(product.price?.toString() || '');
                setDiscount(product.discount?.toString() || '0');
                setStock(product.stock?.toString() || '0');
                setImages(product.images && product.images.length > 0 ? product.images : ['']);
                setCategoryId(product.categoryId?.toString() || '');
                setBrandId(product.brandId?.toString() || '');
                setCategories(cats);
                setBrands(brds || []);

                // New fields
                setSku(product.sku || '');
                setBookingMoney(product.bookingMoney?.toString() || '0');
                setPurchasePoints(product.purchasePoints?.toString() || '0');
                setWarranty(product.warranty || '');
                setCondition(product.condition || '');
                setIsFeatured(product.isFeatured || false);
                setIsNew(product.isNew || false);
                setPeopleViewing(product.peopleViewing?.toString() || '0');

                // Variants
                if (product.variants && product.variants.length > 0) {
                    const storage = product.variants.filter((v: Variant) => v.type === 'storage');
                    const color = product.variants.filter((v: Variant) => v.type === 'color');
                    const region = product.variants.filter((v: Variant) => v.type === 'region');
                    
                    setStorageVariants(storage.length > 0 ? storage : [{ type: 'storage', value: '', price: '', stock: '' }]);
                    setColorVariants(color.length > 0 ? color : [{ type: 'color', value: '', price: '', stock: '', images: [] }]);
                    setRegionVariants(region.length > 0 ? region : [{ type: 'region', value: '', price: '', stock: '' }]);
                } else {
                    setStorageVariants([{ type: 'storage', value: '', price: '', stock: '' }]);
                    setColorVariants([{ type: 'color', value: '', price: '', stock: '', images: [] }]);
                    setRegionVariants([{ type: 'region', value: '', price: '', stock: '' }]);
                }

                // Specifications
                if (product.specifications && typeof product.specifications === 'object') {
                    // Convert flat specifications to sections
                    const flatSpecs = product.specifications as Record<string, string>;
                    const sectionMap: Record<string, { id?: number; title: string; items: { key: string; value: string }[] }> = {};
                    
                    Object.entries(flatSpecs).forEach(([key, value]) => {
                        // Try to parse section from key format: "Section/Subkey"
                        const parts = key.split('/');
                        if (parts.length >= 2) {
                            const sectionTitle = parts[0];
                            const subKey = parts.slice(1).join('/');
                            if (!sectionMap[sectionTitle]) {
                                sectionMap[sectionTitle] = { title: sectionTitle, items: [] };
                            }
                            sectionMap[sectionTitle].items.push({ key: subKey, value });
                        } else {
                            // Default section
                            if (!sectionMap['General']) {
                                sectionMap['General'] = { title: 'General', items: [] };
                            }
                            sectionMap['General'].items.push({ key, value });
                        }
                    });
                    
                    setSpecSections(Object.values(sectionMap));
                } else {
                    setSpecSections([{ title: 'General', items: [{ key: '', value: '' }] }]);
                }
            } catch (err) {
                setError('Failed to load product data');
            } finally {
                setLoading(false);
            }
        };
        if (params.id) fetchData();
    }, [params.id]);

    if (!isAuthorized && user) return <div className="p-10 text-center text-secondary font-bold">Access Denied</div>;
    if (loading) return <div className="p-10 text-center font-black">Loading Product Data...</div>;

    const generateSlug = (text: string) => text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const handleNameChange = (value: string) => {
        setName(value);
        if (!slugEdited) setSlug(generateSlug(value));
    };

    const addImageField = () => setImages([...images, '']);
    const updateImage = (index: number, val: string) => {
        const newImages = [...images];
        newImages[index] = val;
        setImages(newImages);
    };
    const removeImage = (index: number) => {
        if (images.length > 1) setImages(images.filter((_, i) => i !== index));
    };

    const handleImageUpload = async (index: number, file: File) => {
        if (!file) return;
        setUploadingImages(prev => [...prev, index]);
        try {
            const formData = new FormData();
            formData.append('image', file);
            const res = await fetch(`${API_BASE}/api/upload/image`, { method: 'POST', body: formData });
            if (!res.ok) throw new Error('Upload failed');
            const data = await res.json();
            updateImage(index, data.url);
        } catch (err) {
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
            
            const currentImages = colorVariants[variantIndex].images || [];
            const newImages = [...currentImages];
            newImages[imgIndex] = data.url;
            updateColorImages(variantIndex, newImages);
        } catch (err) {
            alert('Failed to upload image');
        }
    };

    const addVariant = (type: 'storage' | 'color' | 'region') => {
        const newVariant = { type, value: '', price: '', stock: '', images: type === 'color' ? [] : undefined };
        if (type === 'storage') setStorageVariants([...storageVariants, newVariant]);
        else if (type === 'color') setColorVariants([...colorVariants, newVariant]);
        else setRegionVariants([...regionVariants, newVariant]);
    };

    const removeVariant = (type: 'storage' | 'color' | 'region', index: number) => {
        if (type === 'storage' && storageVariants.length > 1) setStorageVariants(storageVariants.filter((_, i) => i !== index));
        else if (type === 'color' && colorVariants.length > 1) setColorVariants(colorVariants.filter((_, i) => i !== index));
        else if (type === 'region' && regionVariants.length > 1) setRegionVariants(regionVariants.filter((_, i) => i !== index));
    };

    const addSpecSection = () => setSpecSections([...specSections, { title: '', items: [{ key: '', value: '' }] }]);
    const removeSpecSection = (index: number) => {
        if (specSections.length > 1) setSpecSections(specSections.filter((_, i) => i !== index));
    };
    const updateSpecSectionTitle = (index: number, title: string) => {
        const newSections = [...specSections];
        newSections[index].title = title;
        setSpecSections(newSections);
    };
    const addSpecItem = (sectionIndex: number) => {
        const newSections = [...specSections];
        newSections[sectionIndex].items.push({ key: '', value: '' });
        setSpecSections(newSections);
    };
    const removeSpecItem = (sectionIndex: number, itemIndex: number) => {
        const newSections = [...specSections];
        if (newSections[sectionIndex].items.length > 1) {
            newSections[sectionIndex].items = newSections[sectionIndex].items.filter((_, i) => i !== itemIndex);
            setSpecSections(newSections);
        }
    };
    const updateSpecItem = (sectionIndex: number, itemIndex: number, field: 'key' | 'value', val: string) => {
        const newSections = [...specSections];
        newSections[sectionIndex].items[itemIndex][field] = val;
        setSpecSections(newSections);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        const userObj = JSON.parse(localStorage.getItem('user') || '{}');

        // Convert spec sections to flat object with section titles
        const specsObj: Record<string, string> = {};
        specSections.forEach(section => {
            if (section.title.trim()) {
                section.items.forEach(item => {
                    if (item.key.trim()) {
                        specsObj[`${section.title}/${item.key}`] = item.value;
                    }
                });
            }
        });

        const variants = [
            ...storageVariants.filter(v => v.value.trim()),
            ...colorVariants.filter(v => v.value.trim()),
            ...regionVariants.filter(v => v.value.trim())
        ];

        try {
            const res = await fetch(`${API_BASE}/api/products/${params.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'x-user-email': userObj.email },
                body: JSON.stringify({
                    name, slug, description,
                    price: parseFloat(price) || 0,
                    discount: parseFloat(discount) || 0,
                    stock: parseInt(stock) || 0,
                    categoryId: parseInt(categoryId),
                    brandId: brandId ? parseInt(brandId) : null,
                    images: images.filter(img => img.trim() !== ''),
                    sku, bookingMoney: parseFloat(bookingMoney) || 0,
                    purchasePoints: parseInt(purchasePoints) || 0, warranty, condition,
                    isFeatured, isNew, peopleViewing: parseInt(peopleViewing) || 0,
                    specifications: Object.keys(specsObj).length > 0 ? specsObj : null,
                    variants: variants.map(v => ({
                        type: v.type, value: v.value, price: parseFloat(v.price) || 0, stock: parseInt(v.stock) || 0
                    }))
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to update product');
            }
            router.push('/admin/products');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-12">
            <h1 className="text-3xl font-bold mb-8 text-secondary">Edit Product</h1>
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
                            <label className="block text-sm font-bold text-gray-700 mb-1">Slug</label>
                            <input type="text" value={slug} onChange={(e) => { setSlug(e.target.value); setSlugEdited(true); }} className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 focus:border-primary transition-all font-bold" />
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

                {/* Variants */}
                <div className="bg-white p-8 rounded-2xl shadow-lg space-y-6">
                    <h2 className="text-xl font-black text-secondary uppercase tracking-wider border-b pb-4">Product Variants</h2>
                    <div className="space-y-8">
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

                {/* Specifications */}
                <div className="bg-white p-8 rounded-2xl shadow-lg space-y-6">
                    <div className="flex items-center justify-between border-b pb-4">
                        <h2 className="text-xl font-black text-secondary uppercase tracking-wider">Specifications</h2>
                        <button type="button" onClick={addSpecSection} className="text-primary text-sm font-bold flex items-center gap-1"><Plus className="w-4 h-4" /> Add Section</button>
                    </div>
                    <div className="space-y-6">
                        {specSections.map((section, sectionIdx) => (
                            <div key={sectionIdx} className="border-2 border-gray-100 rounded-xl p-4">
                                <div className="flex gap-3 items-center mb-4">
                                    <input 
                                        type="text" 
                                        placeholder="Section Title (e.g., Physical Specification, Network)" 
                                        value={section.title} 
                                        onChange={(e) => updateSpecSectionTitle(sectionIdx, e.target.value)} 
                                        className="flex-1 border-2 border-gray-100 rounded-xl px-4 py-2 focus:border-primary transition-all font-bold"
                                    />
                                    <button type="button" onClick={() => removeSpecSection(sectionIdx)} className="text-red-500 p-2"><Trash2 className="w-5 h-5" /></button>
                                </div>
                                <div className="space-y-3 pl-4 border-l-2 border-gray-100">
                                    {section.items.map((item, itemIdx) => (
                                        <div key={itemIdx} className="flex gap-3 items-start">
                                            <input 
                                                type="text" 
                                                placeholder="Property (e.g., Build, Weight, Dimensions)" 
                                                value={item.key} 
                                                onChange={(e) => updateSpecItem(sectionIdx, itemIdx, 'key', e.target.value)} 
                                                className="flex-1 border-2 border-gray-100 rounded-xl px-4 py-2 focus:border-primary transition-all"
                                            />
                                            <input 
                                                type="text" 
                                                placeholder="Description" 
                                                value={item.value} 
                                                onChange={(e) => updateSpecItem(sectionIdx, itemIdx, 'value', e.target.value)} 
                                                className="flex-1 border-2 border-gray-100 rounded-xl px-4 py-2 focus:border-primary transition-all"
                                            />
                                            <button type="button" onClick={() => removeSpecItem(sectionIdx, itemIdx)} className="text-red-500 p-2"><Trash2 className="w-5 h-5" /></button>
                                        </div>
                                    ))}
                                    <button type="button" onClick={() => addSpecItem(sectionIdx)} className="text-primary text-sm font-bold flex items-center gap-1"><Plus className="w-4 h-4" /> Add Property</button>
                                </div>
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
                                    {uploadingImages.includes(idx) ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                                    <span className="text-sm font-bold">Upload</span>
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleImageUpload(idx, e.target.files[0])} disabled={uploadingImages.includes(idx)} />
                                </label>
                                <button type="button" onClick={() => removeImage(idx)} className="text-red-500 p-2 hover:bg-red-50 rounded-xl transition-all"><Trash2 className="w-5 h-5" /></button>
                            </div>
                        ))}
                    </div>
                    <button type="button" onClick={addImageField} className="text-primary font-bold flex items-center gap-1"><Plus className="w-5 h-5" /> Add Another Image</button>
                </div>

                <button type="submit" disabled={saving} className="w-full bg-primary text-black font-black py-5 rounded-[2rem] shadow-2xl shadow-primary/40 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-[0.2em] text-sm border border-white/10 disabled:opacity-50">
                    {saving ? 'Saving Changes...' : 'Update Product'}
                </button>
            </form>
        </div>
    );
}
