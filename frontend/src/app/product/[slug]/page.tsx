'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { API_BASE } from '@/lib/api';
import { Star, Edit } from 'lucide-react';

interface Review {
    id: number;
    rating: number;
    comment: string | null;
    userName: string;
    createdAt: string;
}

interface Variant {
    id: number;
    type: string;
    value: string;
    price: number;
    stock: number;
    images?: string[];
}

export default function ProductDetailsPage() {
    const { slug } = useParams();
    const router = useRouter();
    const { addToCart } = useCart();
    const { user } = useAuth();
    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeImage, setActiveImage] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [reviews, setReviews] = useState<Review[]>([]);
    
    // Check if user can edit products
    const canEdit = user && (
        user.role === 'SUPER_ADMIN' || 
        user.role === 'ADMIN' || 
        user.role === 'MANAGER' ||
        user.permissions?.includes('edit_product_full') ||
        user.permissions?.includes('edit_product_content') ||
        user.permissions?.includes('manage_inventory')
    );
    
    // Variant selections
    const [selectedStorage, setSelectedStorage] = useState<Variant | null>(null);
    const [selectedColor, setSelectedColor] = useState<Variant | null>(null);
    const [selectedRegion, setSelectedRegion] = useState<Variant | null>(null);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/products/slug/${slug}`);
                if (!res.ok) throw new Error('Product not found');
                const data = await res.json();
                setProduct(data);
                
                // Set default variants
                if (data.variants && data.variants.length > 0) {
                    const storage = data.variants.find((v: Variant) => v.type === 'storage');
                    const color = data.variants.find((v: Variant) => v.type === 'color');
                    const region = data.variants.find((v: Variant) => v.type === 'region');
                    if (storage) setSelectedStorage(storage);
                    if (color) setSelectedColor(color);
                    if (region) setSelectedRegion(region);
                }
                
                const reviewsRes = await fetch(`${API_BASE}/api/products/${data.id}/reviews`);
                if (reviewsRes.ok) {
                    const reviewsData = await reviewsRes.json();
                    setReviews(reviewsData);
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        if (slug) fetchProduct();
    }, [slug]);

    // Get variants by type
    const storageVariants = useMemo(() => 
        product?.variants?.filter((v: Variant) => v.type === 'storage') || [], 
        [product]
    );
    const colorVariants = useMemo(() => 
        product?.variants?.filter((v: Variant) => v.type === 'color') || [], 
        [product]
    );
    const regionVariants = useMemo(() => 
        product?.variants?.filter((v: Variant) => v.type === 'region') || [], 
        [product]
    );

    // Calculate final price based on variants
    const finalPrice = useMemo(() => {
        if (!product) return 0;
        let price = product.price || 0;
        if (selectedStorage) price += selectedStorage.price;
        if (selectedColor) price += selectedColor.price;
        if (selectedRegion) price += selectedRegion.price;
        
        // Apply discount
        const discount = product.discount || 0;
        if (discount > 0) {
            price = price - (price * discount / 100);
        }
        return price;
    }, [product, selectedStorage, selectedColor, selectedRegion]);

    // Calculate available stock
    const availableStock = useMemo(() => {
        let stock = product?.stock || 0;
        if (selectedStorage) stock = Math.min(stock, selectedStorage.stock);
        if (selectedColor) stock = Math.min(stock, selectedColor.stock);
        if (selectedRegion) stock = Math.min(stock, selectedRegion.stock);
        return stock;
    }, [product, selectedStorage, selectedColor, selectedRegion]);

    // Get images based on selected color (fallback to product images)
    const currentImages = useMemo(() => {
        if (!product) return [];
        // If color has specific images, use those
        if (selectedColor?.images && selectedColor.images.length > 0) {
            return selectedColor.images;
        }
        // Otherwise use product images
        return product.images || [];
    }, [product, selectedColor]);

    if (loading) return <div className="p-20 text-center font-black animate-pulse text-secondary">Loading product details...</div>;
    if (error || !product) return (
        <div className="p-20 text-center">
            <h1 className="text-2xl font-black mb-4">Product Not Found</h1>
            <button onClick={() => router.push('/')} className="bg-primary text-black px-8 py-3 rounded-2xl font-black uppercase tracking-widest shadow-xl">Back to Store</button>
        </div>
    );

    const discount = product.discount || 0;
    const discountPrice = discount > 0 
        ? product.price - (product.price * discount / 100)
        : null;

    const isOutOfStock = availableStock <= 0;
    const isLowStock = availableStock > 0 && availableStock <= 5;

    const handleBuyNow = () => {
        if (isOutOfStock) return;
        addToCart(product, quantity);
        router.push('/checkout');
    };

    return (
        <div className="bg-gray-50 min-h-screen pb-20">
            <div className="container mx-auto px-4 py-12">
                {/* Breadcrumbs */}
                <div className="flex gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 overflow-x-auto no-scrollbar whitespace-nowrap">
                    <span className="hover:text-secondary cursor-pointer" onClick={() => router.push('/')}>Home</span>
                    <span>/</span>
                    <span className="hover:text-secondary cursor-pointer">{product.category.name}</span>
                    <span>/</span>
                    <span className="text-secondary">{product.name}</span>
                </div>

                {/* Edit Button for Admin/Manager */}
                {canEdit && (
                    <div className="mb-6">
                        <button
                            onClick={() => router.push(`/admin/products/edit/${product.id}`)}
                            className="flex items-center gap-2 bg-blue-600 text-black px-4 py-2 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/30"
                        >
                            <Edit className="w-4 h-4" />
                            Edit Product
                        </button>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Left: Images */}
                    <div className="lg:col-span-7 space-y-6">
                        <div className={`bg-white rounded-[40px] p-8 aspect-square relative overflow-hidden border border-gray-100 ${isOutOfStock ? 'opacity-60' : ''}`}>
                            {currentImages[activeImage] ? (
                                <Image
                                    src={currentImages[activeImage]}
                                    alt={product.name}
                                    fill
                                    className="object-contain p-8"
                                    priority
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-50 text-gray-300 font-bold uppercase tracking-widest text-xs">No Image</div>
                            )}
                        </div>

                        {/* Thumbnails */}
                        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                            {currentImages.map((img: string, i: number) => (
                                <button
                                    key={i}
                                    onClick={() => setActiveImage(i)}
                                    className={`relative w-24 h-24 flex-shrink-0 bg-white rounded-2xl p-2 border-2 transition-all ${activeImage === i ? 'border-primary shadow-lg ring-4 ring-primary/10' : 'border-transparent opacity-60 hover:opacity-100 hover:border-gray-200'}`}
                                >
                                    <Image src={img} alt={`${product.name} ${i}`} fill className="object-contain p-2" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Right: Info */}
                    <div className="lg:col-span-5 space-y-8">
                        <div>
                            <span className="bg-secondary/10 text-secondary text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-[0.2em] mb-4 inline-block">
                                {product.category.name}
                            </span>
                            <h1 className="text-3xl lg:text-4xl font-black text-secondary leading-tight mb-4">{product.name}</h1>
                            
                            {/* Price Display */}
                            <div className="flex items-center gap-4 mb-4">
                                {discount > 0 ? (
                                    <>
                                        <span className="text-primary text-4xl font-black">৳{Math.round(finalPrice).toLocaleString()}</span>
                                        <div className="flex flex-col">
                                            <span className="text-gray-400 text-sm line-through">৳{product.price.toLocaleString()}</span>
                                            <span className="text-red-500 text-xs font-black uppercase tracking-widest">Saved {discount}%</span>
                                        </div>
                                    </>
                                ) : (
                                    <span className="text-primary text-4xl font-black">৳{Math.round(finalPrice).toLocaleString()}</span>
                                )}
                            </div>

                            {/* Additional Info */}
                            {product.peopleViewing > 0 && (
                                <p className="text-gray-400 text-sm mb-4">{product.peopleViewing} people are viewing this product</p>
                            )}
                            {product.condition && (
                                <p className="text-gray-500 text-sm mb-2">Condition: <span className="font-bold">{product.condition}</span></p>
                            )}
                            {product.sku && (
                                <p className="text-gray-500 text-sm mb-2">SKU: <span className="font-bold">{product.sku}</span></p>
                            )}
                        </div>

                        {/* Storage Variants */}
                        {storageVariants.length > 0 && (
                            <div>
                                <label className="block text-sm font-black text-gray-700 uppercase tracking-wider mb-3">Storage</label>
                                <div className="flex flex-wrap gap-2">
                                    {storageVariants.map((variant: Variant) => (
                                        <button
                                            key={variant.id}
                                            onClick={() => setSelectedStorage(variant)}
                                            className={`px-4 py-2 rounded-xl font-bold text-sm border-2 transition-all ${selectedStorage?.id === variant.id ? 'border-primary bg-primary text-black' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                                        >
                                            {variant.value}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Color Variants */}
                        {colorVariants.length > 0 && (
                            <div>
                                <label className="block text-sm font-black text-gray-700 uppercase tracking-wider mb-3">Color</label>
                                <div className="flex flex-wrap gap-2">
                                    {colorVariants.map((variant: Variant) => (
                                        <button
                                            key={variant.id}
                                            onClick={() => setSelectedColor(variant)}
                                            className={`px-4 py-2 rounded-xl font-bold text-sm border-2 transition-all ${selectedColor?.id === variant.id ? 'border-primary bg-primary text-black' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                                        >
                                            {variant.value}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Region Variants */}
                        {regionVariants.length > 0 && (
                            <div>
                                <label className="block text-sm font-black text-gray-700 uppercase tracking-wider mb-3">Region</label>
                                <div className="flex flex-wrap gap-2">
                                    {regionVariants.map((variant: Variant) => (
                                        <button
                                            key={variant.id}
                                            onClick={() => setSelectedRegion(variant)}
                                            className={`px-4 py-2 rounded-xl font-bold text-sm border-2 transition-all ${selectedRegion?.id === variant.id ? 'border-primary bg-primary text-black' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                                        >
                                            {variant.value}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Booking Money & Points */}
                        {(product.bookingMoney > 0 || product.purchasePoints > 0) && (
                            <div className="bg-gray-50 p-4 rounded-xl space-y-2">
                                {product.bookingMoney > 0 && (
                                    <p className="text-sm"><span className="font-bold">Booking Money:</span> ৳{product.bookingMoney.toLocaleString()}</p>
                                )}
                                {product.purchasePoints > 0 && (
                                    <p className="text-sm"><span className="font-bold">Purchase Points:</span> {product.purchasePoints}</p>
                                )}
                            </div>
                        )}

                        {/* Rating */}
                        {product.rating !== undefined && product.rating > 0 && (
                            <div className="flex items-center gap-2">
                                <div className="flex">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <span key={star} className={`text-lg ${star <= Math.round(product.rating) ? 'text-yellow-500' : 'text-gray-300'}`}>★</span>
                                    ))}
                                </div>
                                <span className="text-gray-500 text-sm font-medium">({product.rating})</span>
                            </div>
                        )}

                        {/* Stock Status */}
                        <div className="flex items-center gap-3">
                            {isOutOfStock ? (
                                <span className="bg-red-100 text-red-700 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">Stock Out</span>
                            ) : isLowStock ? (
                                <span className="bg-amber-100 text-amber-700 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">Low Stock</span>
                            ) : (
                                <span className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">In Stock ({availableStock} available)</span>
                            )}
                        </div>

                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/40 space-y-6">
                            <div className="flex items-center justify-between py-2">
                                <span className="font-black text-secondary uppercase tracking-widest text-xs">Quantity</span>
                                <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-2xl border border-gray-100">
                                    <button
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        disabled={isOutOfStock}
                                        className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-md font-black hover:bg-primary hover:text-black transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                    >-</button>
                                    <span className="w-8 text-center font-black text-lg">{quantity}</span>
                                    <button
                                        onClick={() => setQuantity(Math.min(quantity + 1, availableStock))}
                                        disabled={isOutOfStock || quantity >= availableStock}
                                        className={`w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-md font-black transition-all ${isOutOfStock || quantity >= availableStock
                                            ? 'opacity-40 cursor-not-allowed text-gray-300'
                                            : 'hover:bg-primary hover:text-black'
                                            }`}
                                    >+</button>
                                </div>
                            </div>

                            {!isOutOfStock && quantity >= availableStock && (
                                <p className="text-amber-600 text-[10px] font-black uppercase tracking-widest bg-amber-50 px-3 py-2 rounded-xl text-center">Maximum stock quantity reached</p>
                            )}

                            <div className="flex gap-4">
                                <button
                                    onClick={() => { if (!isOutOfStock) addToCart(product, quantity); }}
                                    disabled={isOutOfStock}
                                    className={`flex-1 py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl border-2 border-white/20 active:scale-95 transition-all ${isOutOfStock
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                                        : 'bg-secondary text-black hover:bg-black hover:text-white shadow-secondary/30'
                                        }`}
                                >
                                    {isOutOfStock ? 'Stock Out' : 'Add to Cart'}
                                </button>
                                <button
                                    onClick={handleBuyNow}
                                    disabled={isOutOfStock}
                                    className={`flex-1 py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl border-2 border-white/20 active:scale-95 transition-all ${isOutOfStock
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                                        : 'bg-primary text-black hover:bg-orange-600 shadow-primary/30'
                                        }`}
                                >
                                    {isOutOfStock ? 'Stock Out' : 'Buy Now'}
                                </button>
                            </div>
                        </div>

                        {/* Warranty */}
                        {product.warranty && (
                            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                                <h3 className="font-black text-blue-800 uppercase tracking-widest text-sm mb-2">Warranty</h3>
                                <p className="text-blue-700 text-sm">{product.warranty}</p>
                            </div>
                        )}

                        {/* Specifications */}
                        {product.specifications && Object.keys(product.specifications).length > 0 && (
                            <div className="space-y-4">
                                <h3 className="font-black text-secondary uppercase tracking-widest text-sm flex items-center gap-2">
                                    <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                                    Specifications
                                </h3>
                                <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
                                    <table className="w-full">
                                        <tbody>
                                            {Object.entries(product.specifications).map(([key, value]: [string, any]) => (
                                                <tr key={key} className="border-b border-gray-100 last:border-0">
                                                    <td className="py-3 text-sm font-bold text-gray-600 w-1/3">{key}</td>
                                                    <td className="py-3 text-sm text-gray-800">{value}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            <h3 className="font-black text-secondary uppercase tracking-widest text-sm flex items-center gap-2">
                                <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                                Product Description
                            </h3>
                            <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-lg text-gray-500 leading-relaxed text-sm whitespace-pre-line">
                                {product.description || "No description available for this product."}
                            </div>
                        </div>

                        {/* Reviews Section */}
                        <div className="mt-12 space-y-6">
                            <h3 className="font-black text-secondary uppercase tracking-widest text-lg flex items-center gap-2">
                                <span className="w-1.5 h-8 bg-primary rounded-full"></span>
                                Customer Reviews
                                {reviews.length > 0 && (
                                    <span className="text-gray-400 text-sm font-medium normal-case ml-2">({reviews.length} reviews)</span>
                                )}
                            </h3>
                            
                            {reviews.length === 0 ? (
                                <div className="bg-white p-8 rounded-[32px] border border-gray-100 text-center">
                                    <p className="text-gray-400 font-medium">No reviews yet. Be the first to review this product!</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {reviews.map((review) => (
                                        <div key={review.id} className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center font-black text-primary">
                                                        {review.userName.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-secondary text-sm">{review.userName}</p>
                                                        <p className="text-gray-400 text-[10px]">
                                                            {new Date(review.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <Star 
                                                            key={star} 
                                                            className={`w-4 h-4 ${star <= review.rating ? 'fill-yellow-500 text-yellow-500' : 'text-gray-200'}`} 
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                            {review.comment && (
                                                <p className="text-gray-500 text-sm leading-relaxed">{review.comment}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
