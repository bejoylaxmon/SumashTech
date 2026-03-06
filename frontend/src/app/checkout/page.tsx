'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';

export default function CheckoutPage() {
    const { cart, cartTotal, clearCart } = useCart();
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('COD');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (cart.length === 0) {
            alert('Your cart is empty');
            return;
        }

        setLoading(true);

        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!user.id) {
            alert('Please login first');
            router.push('/login');
            return;
        }

        try {
            const apiBase = window.location.origin.replace(':3000', ':54321');
            const res = await fetch(`${apiBase}/api/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    total: cartTotal,
                    address,
                    phone,
                    paymentMethod,
                    items: cart.map(item => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        price: item.price
                    }))
                }),
            });

            if (!res.ok) throw new Error('Order failed');

            const order = await res.json();
            alert(`Order #${order.id} placed successfully!`);
            clearCart();
            router.push('/');
        } catch (err: any) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-12">
            <h1 className="text-3xl font-bold mb-8 text-secondary">Checkout</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-lg space-y-6">
                    <h2 className="text-xl font-bold mb-4">Shipping Information</h2>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Full Address</label>
                        <textarea
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            required
                            className="w-full border rounded-xl px-4 py-2"
                            placeholder="Street, City, Area"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Phone Number</label>
                        <input
                            type="text"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                            className="w-full border rounded-xl px-4 py-2"
                            placeholder="01xxxxxxxxx"
                        />
                    </div>

                    <h2 className="text-xl font-bold mb-4 pt-4 border-t">Payment Method</h2>
                    <div className="space-y-4">
                        <label className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${paymentMethod === 'COD' ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-gray-200'}`}>
                            <input
                                type="radio"
                                name="payment"
                                value="COD"
                                checked={paymentMethod === 'COD'}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                className="h-4 w-4 text-primary"
                            />
                            <div className="ml-4">
                                <p className="font-bold">Cash on Delivery</p>
                                <p className="text-xs text-gray-500">Pay when you receive the product</p>
                            </div>
                        </label>
                        <label className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${paymentMethod === 'BKASH' ? 'border-pink-500 bg-pink-50' : 'border-gray-100 hover:border-gray-200'}`}>
                            <input
                                type="radio"
                                name="payment"
                                value="BKASH"
                                checked={paymentMethod === 'BKASH'}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                className="h-4 w-4 text-pink-500"
                            />
                            <div className="ml-4">
                                <p className="font-bold text-pink-600">bKash Payment</p>
                                <p className="text-xs text-gray-500">Pay securely using bKash</p>
                            </div>
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || cart.length === 0}
                        className="w-full bg-secondary text-white font-black py-5 rounded-2xl shadow-xl shadow-secondary/30 mt-8 hover:bg-black transition-all uppercase tracking-widest text-xs border-2 border-white/20 active:scale-95"
                    >
                        {loading ? 'Processing...' : `Confirm Order (৳${cartTotal.toLocaleString()})`}
                    </button>
                </form>

                <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-xl h-fit">
                    <h2 className="text-xl font-black mb-8 uppercase tracking-widest text-secondary flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                        Order Summary
                    </h2>
                    <div className="space-y-6">
                        {cart.map((item, i) => (
                            <div key={i} className="flex justify-between items-center text-sm">
                                <div className="flex flex-col">
                                    <span className="font-black text-secondary">{item.name}</span>
                                    <span className="text-gray-400 text-[10px] font-bold uppercase">Qty: {item.quantity} × ৳{item.price.toLocaleString()}</span>
                                </div>
                                <span className="font-black text-secondary">৳{(item.price * item.quantity).toLocaleString()}</span>
                            </div>
                        ))}
                        <div className="border-t border-dashed pt-6 mt-6 flex justify-between items-center text-lg font-black">
                            <span className="text-secondary uppercase tracking-widest text-xs">Total Amount</span>
                            <span className="text-primary text-2xl">৳{cartTotal.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
