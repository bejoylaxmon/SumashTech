'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';

export default function ProductDetailsPage() {
    const { slug } = useParams();
    const router = useRouter();
    const { addToCart } = useCart();
    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeImage, setActiveImage] = useState(0);
    const [quantity, setQuantity] = useState(1);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const apiBase = window.location.origin.replace(':3000', ':54321');
                const res = await fetch(`${apiBase}/api/products/slug/${slug}`);
                if (!res.ok) throw new Error('Product not found');
                const data = await res.json();
                setProduct(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        if (slug) fetchProduct();
    }, [slug]);

    if (loading) return <div className="p-20 text-center font-black animate-pulse text-secondary">Loading product details...</div>;
    if (error || !product) return (
        <div className="p-20 text-center">
            <h1 className="text-2xl font-black mb-4">Product Not Found</h1>
            <button onClick={() => router.push('/')} className="bg-primary text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest shadow-xl">Back to Store</button>
        </div>
    );

    const discountPrice = product.discount
        ? product.price - (product.price * product.discount / 100)
        : null;

    const stock = product.stock ?? 0;
    const isOutOfStock = stock <= 0;
    const isLowStock = stock > 0 && stock <= 3;

    const handleBuyNow = () => {
        if (isOutOfStock) return;
        addToCart(product, quantity);
        router.push('/checkout');
    };

    return (
        <div className="bg-gray-50 min-h-screen pb-20">
            <div className="container mx-auto px-4 py-12">
                {/* Breadcrumbs */}
                <div className="flex gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 mb-8 overflow-x-auto no-scrollbar whitespace-nowrap">
                    <span className="hover:text-secondary cursor-pointer" onClick={() => router.push('/')}>Home</span>
                    <span>/</span>
                    <span className="hover:text-secondary cursor-pointer">{product.category.name}</span>
                    <span>/</span>
                    <span className="text-secondary">{product.name}</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Left: Images */}
                    <div className="lg:col-span-7 space-y-6">
                        <div className={`bg-white rounded-[40px] p-8 aspect-square relative overflow-hidden border border-gray-100 shadow-2xl shadow-gray-200/50 ${isOutOfStock ? 'opacity-60' : ''}`}>
                            {product.images?.[activeImage] ? (
                                <Image
                                    src={product.images[activeImage]}
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
                            {product.images?.map((img: string, i: number) => (
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
                            <div className="flex items-center gap-4">
                                {discountPrice ? (
                                    <>
                                        <span className="text-primary text-4xl font-black">৳{discountPrice.toLocaleString()}</span>
                                        <div className="flex flex-col">
                                            <span className="text-gray-400 text-sm line-through">৳{product.price.toLocaleString()}</span>
                                            <span className="text-red-500 text-xs font-black uppercase tracking-widest">Saved {product.discount}%</span>
                                        </div>
                                    </>
                                ) : (
                                    <span className="text-primary text-4xl font-black">৳{product.price.toLocaleString()}</span>
                                )}
                            </div>
                        </div>

                        {/* Stock Status */}
                        <div className="flex items-center gap-3">
                            {isOutOfStock ? (
                                <span className="bg-red-100 text-red-700 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">Out of Stock</span>
                            ) : isLowStock ? (
                                <span className="bg-amber-100 text-amber-700 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">Low Stock — Only {stock} left</span>
                            ) : (
                                <span className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">In Stock ({stock} available)</span>
                            )}
                        </div>

                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/40 space-y-6">
                            <div className="flex items-center justify-between py-2">
                                <span className="font-black text-secondary uppercase tracking-widest text-xs">Quantity</span>
                                <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-2xl border border-gray-100">
                                    <button
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        disabled={isOutOfStock}
                                        className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-md font-black hover:bg-primary hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                    >-</button>
                                    <span className="w-8 text-center font-black text-lg">{quantity}</span>
                                    <button
                                        onClick={() => setQuantity(Math.min(quantity + 1, stock))}
                                        disabled={isOutOfStock || quantity >= stock}
                                        className={`w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-md font-black transition-all ${isOutOfStock || quantity >= stock
                                                ? 'opacity-40 cursor-not-allowed text-gray-300'
                                                : 'hover:bg-primary hover:text-white'
                                            }`}
                                    >+</button>
                                </div>
                            </div>

                            {!isOutOfStock && quantity >= stock && (
                                <p className="text-amber-600 text-[10px] font-black uppercase tracking-widest bg-amber-50 px-3 py-2 rounded-xl text-center">Maximum stock quantity reached</p>
                            )}

                            <div className="flex gap-4">
                                <button
                                    onClick={() => { if (!isOutOfStock) addToCart(product, quantity); }}
                                    disabled={isOutOfStock}
                                    className={`flex-1 py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl border-2 border-white/20 active:scale-95 transition-all ${isOutOfStock
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                                            : 'bg-secondary text-white hover:bg-black shadow-secondary/30'
                                        }`}
                                >
                                    {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                                </button>
                                <button
                                    onClick={handleBuyNow}
                                    disabled={isOutOfStock}
                                    className={`flex-1 py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl border-2 border-white/20 active:scale-95 transition-all ${isOutOfStock
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                                            : 'bg-primary text-white hover:bg-orange-600 shadow-primary/30'
                                        }`}
                                >
                                    {isOutOfStock ? 'Unavailable' : 'Buy Now'}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="font-black text-secondary uppercase tracking-widest text-sm flex items-center gap-2">
                                <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                                Product Description
                            </h3>
                            <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-lg text-gray-500 leading-relaxed text-sm whitespace-pre-line">
                                {product.description || "No description available for this product."}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
