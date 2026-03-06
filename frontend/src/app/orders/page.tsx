'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { API_BASE } from '@/lib/api';

export default function UserOrdersPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { user } = useAuth();

    useEffect(() => {
        const fetchOrders = async () => {
            if (!user) return;
            try {
                const res = await fetch(`${API_BASE}/api/orders/user/${user.email}`);
                const data = await res.json();
                if (Array.isArray(data)) {
                    setOrders(data);
                } else {
                    setOrders([]);
                    setError(data.error || 'Invalid response');
                }
            } catch (err) {
                setError('Failed to fetch orders');
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, [user]);

    if (loading) return <div className="p-10 text-center font-bold">Loading your orders...</div>;
    if (error) return <div className="p-10 text-center text-red-500 font-bold">Error: {error}</div>;

    return (
        <div className="bg-gray-50 min-h-screen py-12">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-3xl font-black text-secondary uppercase tracking-widest flex items-center gap-3">
                            <span className="w-1.5 h-8 bg-primary rounded-full"></span>
                            My Orders
                        </h1>
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2 ml-4">Purchase History & Status</p>
                    </div>
                    {orders.length > 0 && (
                        <div className="bg-white px-6 py-3 rounded-2xl border border-gray-100 shadow-sm">
                            <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest block mb-1">Total Orders</span>
                            <span className="text-xl font-black text-secondary">{orders.length}</span>
                        </div>
                    )}
                </div>

                {orders.length === 0 ? (
                    <div className="bg-white p-20 rounded-[40px] shadow-2xl shadow-gray-200/50 text-center border border-gray-100">
                        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8">
                            <span className="text-5xl">📦</span>
                        </div>
                        <h2 className="text-2xl font-black text-secondary uppercase tracking-widest mb-4">No orders found</h2>
                        <p className="text-gray-400 mb-10 max-w-xs mx-auto text-sm font-medium">You haven't placed any orders yet. Start exploring our premium collection.</p>
                        <a href="/" className="bg-primary text-white px-12 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/30 hover:bg-orange-600 transition-all border-2 border-white/20 active:scale-95">Start Shopping</a>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {orders.map((order) => (
                            <div key={order.id} className="bg-white rounded-[32px] shadow-sm hover:shadow-xl transition-all border border-gray-100 overflow-hidden group">
                                <div className="px-8 py-6 bg-gray-50/50 border-b border-gray-100 flex flex-wrap justify-between items-center gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-white w-12 h-12 rounded-xl flex items-center justify-center shadow-sm font-black text-primary border border-gray-100">#</div>
                                        <div>
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Order Reference</span>
                                            <p className="font-black text-secondary text-lg">#{order.id}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-8">
                                        <div className="text-right">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Placed On</span>
                                            <p className="font-black text-secondary text-sm">{new Date(order.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Payment</span>
                                            <p className="font-black text-secondary text-sm uppercase tracking-wider">{order.paymentMethod}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-8">
                                    <div className="space-y-6 mb-8">
                                        {order.items.map((item: any) => (
                                            <div key={item.id} className="flex justify-between items-start group/item">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-gray-50 rounded-lg flex-shrink-0 flex items-center justify-center text-xl">📱</div>
                                                    <div>
                                                        <h4 className="font-black text-secondary group-hover/item:text-primary transition-colors">{item.product.name}</h4>
                                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Qty: {item.quantity} × ৳{item.price.toLocaleString()}</span>
                                                    </div>
                                                </div>
                                                <span className="font-black text-secondary bg-gray-50 px-3 py-1 rounded-lg">৳{(item.price * item.quantity).toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex flex-col sm:flex-row justify-between items-center pt-8 border-t border-dashed border-gray-100 gap-6">
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Status:</span>
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${order.status === 'DELIVERED' ? 'bg-green-500 text-white' :
                                                order.status === 'CANCELLED' ? 'bg-red-500 text-white' :
                                                    order.status === 'SHIPPED' ? 'bg-blue-500 text-white' :
                                                        'bg-yellow-400 text-white'
                                                }`}>
                                                {order.status}
                                            </span>
                                        </div>
                                        <div className="text-center sm:text-right">
                                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mb-1">Final Payable Amount</p>
                                            <p className="text-3xl font-black text-primary tracking-tight">৳{order.total.toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
