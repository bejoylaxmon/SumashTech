'use client';

import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:54321';

export default function CartPage() {
    const { cart, removeFromCart, updateQuantity, cartTotal } = useCart();
    const { user } = useAuth();
    const router = useRouter();

    // Fire cart-abandon event when customer leaves with items still in cart
    useEffect(() => {
        const handleLeave = () => {
            if (!user || cart.length === 0) return;
            const payload = JSON.stringify({
                userId: user.id,
                cartItems: cart.map(i => ({ name: i.name, quantity: i.quantity })),
                cartTotal,
            });
            // sendBeacon is fire-and-forget, works even as page is unloading
            navigator.sendBeacon(
                `${API_URL}/api/events/cart-abandon`,
                new Blob([payload], { type: 'application/json' })
            );
        };

        window.addEventListener('pagehide', handleLeave);
        return () => window.removeEventListener('pagehide', handleLeave);
    }, [user, cart, cartTotal]);

    if (cart.length === 0) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
                <div className="bg-gray-50 p-12 rounded-[50px] mb-8 relative">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
                        <span className="text-4xl font-black text-gray-100">?</span>
                    </div>
                </div>
                <h1 className="text-2xl font-black text-secondary uppercase tracking-widest mb-4">Your Cart is Empty</h1>
                <p className="text-gray-400 mb-8 max-w-xs text-center text-sm font-medium">Looks like you haven't added anything to your cart yet.</p>
                <Link href="/" className="bg-primary text-black px-10 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/30 hover:bg-orange-600 transition-all active:scale-95">
                    Start Shopping
                </Link>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen py-12">
            <div className="container mx-auto px-4">
                <h1 className="text-3xl font-black text-secondary mb-12 uppercase tracking-widest flex items-center gap-3">
                    <span className="w-1.5 h-8 bg-primary rounded-full"></span>
                    My Shopping Cart
                </h1>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Cart Items */}
                    <div className="lg:col-span-8 space-y-6">
                        {cart.map((item) => (
                            <div key={item.productId} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl transition-all flex flex-col sm:flex-row items-center gap-8 relative group">
                                <button
                                    onClick={() => removeFromCart(item.productId)}
                                    className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors p-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>

                                <div className="h-32 w-32 relative bg-gray-50 rounded-2xl p-4 flex-shrink-0">
                                    <Image src={item.image} alt={item.name} fill className="object-contain p-2" />
                                </div>

                                <div className="flex-grow space-y-2 text-center sm:text-left">
                                    <Link href={`/product/${item.slug}`} className="text-lg font-black text-secondary hover:text-primary transition-colors line-clamp-1">{item.name}</Link>
                                    <p className="text-primary font-black text-xl">৳{item.price.toLocaleString()}</p>
                                    <div className="flex items-center justify-center sm:justify-start gap-4 pt-2">
                                        <div className="flex items-center gap-3 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                                            <button
                                                onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1))}
                                                className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm font-black hover:bg-red-50 text-red-500 transition-all border border-gray-100"
                                            >-</button>
                                            <span className="w-6 text-center font-black text-sm">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                                disabled={item.quantity >= item.stock}
                                                className={`w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm font-black transition-all border border-gray-100 ${item.quantity >= item.stock
                                                    ? 'opacity-40 cursor-not-allowed text-gray-300'
                                                    : 'hover:bg-green-50 text-green-500'
                                                    }`}
                                            >+</button>
                                        </div>
                                        {item.quantity >= item.stock && (
                                            <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest bg-amber-50 px-2 py-1 rounded-lg">Max stock</span>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right hidden sm:block">
                                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Subtotal</p>
                                    <p className="font-black text-secondary text-lg">৳{(item.price * item.quantity).toLocaleString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Summary */}
                    <div className="lg:col-span-4">
                        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-2xl shadow-gray-200/50 sticky top-24 space-y-8">
                            <h2 className="text-xl font-black text-secondary uppercase tracking-widest border-b border-gray-50 pb-6">Summary</h2>

                            <div className="space-y-4">
                                <div className="flex justify-between text-sm font-bold text-gray-500">
                                    <span>Subtotal</span>
                                    <span>৳{cartTotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm font-bold text-gray-500">
                                    <span>Delivery Charge</span>
                                    <span className="text-green-500 uppercase tracking-widest text-[10px]">Free</span>
                                </div>
                                <div className="border-t border-dashed pt-6 mt-6 flex justify-between items-center">
                                    <span className="font-black text-secondary uppercase tracking-widest text-xs">Total</span>
                                    <span className="text-primary font-black text-3xl">৳{cartTotal.toLocaleString()}</span>
                                </div>
                            </div>

                            <button
                                onClick={() => router.push('/checkout')}
                                className="w-full bg-primary text-black py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-orange-600 transition-all shadow-xl shadow-primary/30 border-2 border-white/20 active:scale-95"
                            >
                                Proceed to Checkout
                            </button>

                            <button
                                onClick={() => router.push('/')}
                                className="w-full bg-gray-50 text-secondary py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-100 transition-all border-2 border-gray-100 active:scale-95"
                            >
                                Continue Shopping
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
