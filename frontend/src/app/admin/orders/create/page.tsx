'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { API_BASE } from '@/lib/api';

export default function AdminCreateOrderPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [products, setProducts] = useState<any[]>([]);
    const [selectedItems, setSelectedItems] = useState<any[]>([]);
    const [customerName, setCustomerName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('COD');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/products`);
                const data = await res.json();
                setProducts(data);
            } catch (err) {
                setError('Failed to fetch products');
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    const addItem = (productId: number) => {
        const product = products.find(p => p.id === productId);
        if (!product) return;

        const existing = selectedItems.find(item => item.productId === productId);
        if (existing) {
            setSelectedItems(selectedItems.map(item =>
                item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item
            ));
        } else {
            setSelectedItems([...selectedItems, {
                productId: product.id,
                name: product.name,
                price: product.price,
                quantity: 1
            }]);
        }
    };

    const removeItem = (productId: number) => {
        setSelectedItems(selectedItems.filter(item => item.productId !== productId));
    };

    const totalAmount = selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedItems.length === 0) {
            setError('Please add at least one item');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            const res = await fetch(`${API_BASE}/api/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user?.id, // Order placed by this staff member
                    total: totalAmount,
                    address: `${customerName} - ${address}`,
                    phone: phone,
                    paymentMethod: paymentMethod,
                    items: selectedItems.map(item => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        price: item.price
                    }))
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || data.details || 'Failed to create order');
            }

            alert(`Order Created Successfully! #${data.id}`);
            router.push('/admin/orders');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-10 text-center font-black">Loading POS Interface...</div>;

    return (
        <div className="container mx-auto px-4 py-12 flex flex-col lg:flex-row gap-10">
            {/* Product Selection */}
            <div className="lg:w-2/3">
                <h1 className="text-3xl font-black mb-8 text-secondary uppercase tracking-tighter">Manual Order / POS</h1>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {products.map(product => (
                        <div key={product.id} className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 hover:scale-[1.02] transition-transform cursor-pointer group"
                            onClick={() => addItem(product.id)}>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{product.category?.name || 'Category'}</p>
                            <h3 className="font-bold text-secondary mb-2 line-clamp-1">{product.name}</h3>
                            <div className="flex justify-between items-center">
                                <span className="text-primary font-black">৳{product.price.toLocaleString()}</span>
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${product.stock > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                    Stock: {product.stock}
                                </span>
                            </div>
                            <button className="w-full mt-4 bg-gray-50 text-secondary font-black py-2 rounded-xl text-[10px] uppercase tracking-widest group-hover:bg-primary group-hover:text-black transition-colors">
                                Select
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Cart & Customer Info */}
            <div className="lg:w-1/3">
                <div className="sticky top-24 bg-white p-8 rounded-[3rem] shadow-2xl border border-gray-50">
                    <h2 className="text-xl font-black text-secondary mb-6 flex items-center gap-2">
                        <span>🛒</span> Order Summary
                    </h2>

                    {selectedItems.length === 0 ? (
                        <div className="text-center py-10 text-gray-400 font-bold uppercase text-[10px] tracking-widest border-2 border-dashed border-gray-100 rounded-2xl mb-6">
                            Pick products from the left
                        </div>
                    ) : (
                        <div className="space-y-4 mb-8 max-h-60 overflow-y-auto pr-2 no-scrollbar">
                            {selectedItems.map(item => (
                                <div key={item.productId} className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl">
                                    <div>
                                        <p className="font-bold text-secondary text-sm">{item.name}</p>
                                        <p className="text-[10px] font-black text-gray-400">৳{item.price.toLocaleString()} x {item.quantity}</p>
                                    </div>
                                    <button onClick={() => removeItem(item.productId)} className="text-red-500 font-black text-lg">×</button>
                                </div>
                            ))}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && <div className="text-red-500 text-[10px] font-black uppercase mb-4">{error}</div>}

                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block ml-2">Customer Name</label>
                            <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required
                                className="w-full bg-gray-50 border-2 border-transparent focus:border-primary rounded-2xl px-5 py-3 outline-none font-bold text-secondary transition-all" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block ml-2">Phone</label>
                                <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} required
                                    className="w-full bg-gray-50 border-2 border-transparent focus:border-primary rounded-2xl px-5 py-3 outline-none font-bold text-secondary transition-all" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block ml-2">Payment</label>
                                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}
                                    className="w-full bg-gray-50 border-2 border-transparent focus:border-primary rounded-2xl px-5 py-3 outline-none font-bold text-secondary transition-all appearance-none">
                                    <option value="COD">CASH ON DELIVERY</option>
                                    <option value="CASH">CASH (IN-STORE)</option>
                                    <option value="BKASH">BKASH</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block ml-2">Detailed Address</label>
                            <textarea value={address} onChange={(e) => setAddress(e.target.value)} required
                                className="w-full bg-gray-50 border-2 border-transparent focus:border-primary rounded-2xl px-5 py-3 outline-none font-bold text-secondary transition-all h-20" />
                        </div>

                        <div className="pt-6 border-t border-gray-100">
                            <div className="flex justify-between items-center mb-6">
                                <span className="text-gray-400 text-xs font-black uppercase tracking-widest">Total Payable</span>
                                <span className="text-2xl font-black text-primary">৳{totalAmount.toLocaleString()}</span>
                            </div>
                            <button type="submit" disabled={submitting || selectedItems.length === 0}
                                className="w-full bg-secondary text-black font-black py-5 rounded-[2rem] shadow-2xl shadow-secondary/40 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all uppercase tracking-[0.2em] text-sm border border-white/10"
                            >
                                {submitting ? 'Creating Order...' : 'Confirm Manual Order'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
