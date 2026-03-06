'use client';

import { useState, useEffect } from 'react';

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchOrders = async () => {
        try {
            const apiBase = window.location.origin.replace(':3000', ':54321');
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const res = await fetch(`${apiBase}/api/admin/orders`, {
                headers: { 'x-user-email': user.email }
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to fetch orders');
            }

            if (Array.isArray(data)) {
                setOrders(data);
            } else {
                setOrders([]);
                setError('Received invalid data format');
            }
        } catch (err: any) {
            setError(err.message);
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const updateStatus = async (orderId: number, status: string) => {
        try {
            const apiBase = window.location.origin.replace(':3000', ':54321');
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            await fetch(`${apiBase}/api/admin/orders/${orderId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-email': user.email
                },
                body: JSON.stringify({ status }),
            });
            fetchOrders();
        } catch (err) {
            alert('Failed to update status');
        }
    };

    if (loading) return <div className="p-10 text-center">Loading orders...</div>;
    if (error) return <div className="p-10 text-center text-red-500 font-bold">Error: {error}</div>;

    return (
        <div className="bg-gray-50 min-h-screen py-12">
            <div className="container mx-auto px-4 max-w-7xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-4xl font-black text-secondary uppercase tracking-widest flex items-center gap-3">
                            <span className="w-2 h-10 bg-primary rounded-full"></span>
                            Order Management
                        </h1>
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em] mt-3 ml-5">Logistics & fulfillment Control</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-white px-8 py-4 rounded-[24px] shadow-xl shadow-gray-200/50 border border-gray-100 flex flex-col justify-center">
                            <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest block mb-1">Total Queue</span>
                            <span className="text-2xl font-black text-secondary">{orders.length}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[40px] shadow-2xl shadow-gray-200/60 border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Referance</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Customer Profile</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Revenue</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Method</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Current Status</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Action Control</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50/80 transition-colors group">
                                        <td className="px-10 py-8 font-black text-secondary tracking-tighter">
                                            <div className="bg-white w-12 h-12 rounded-xl flex items-center justify-center shadow-sm border border-gray-100 font-black text-primary">#{order.id}</div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="font-black text-secondary text-base group-hover:text-primary transition-colors">{order.user.name}</div>
                                            <div className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-1">{order.user.email}</div>
                                        </td>
                                        <td className="px-10 py-8 font-black text-secondary text-lg">৳{order.total.toLocaleString()}</td>
                                        <td className="px-10 py-8">
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${order.paymentMethod === 'BKASH' ? 'bg-pink-50 text-pink-600 border-pink-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                                                }`}>
                                                {order.paymentMethod}
                                            </span>
                                        </td>
                                        <td className="px-10 py-8">
                                            <span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg border-2 border-white ${order.status === 'DELIVERED' ? 'bg-green-500 text-white shadow-green-200' :
                                                    order.status === 'CANCELLED' ? 'bg-red-500 text-white shadow-red-200' :
                                                        order.status === 'SHIPPED' ? 'bg-blue-500 text-white shadow-blue-200' :
                                                            'bg-yellow-400 text-white shadow-yellow-200'
                                                }`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-10 py-8">
                                            <select
                                                value={order.status}
                                                onChange={(e) => updateStatus(order.id, e.target.value)}
                                                className="bg-white border-2 border-gray-100 rounded-[18px] px-6 py-3 text-[10px] font-black uppercase tracking-widest focus:border-primary focus:ring-4 ring-primary/10 outline-none transition-all cursor-pointer shadow-sm hover:border-gray-300"
                                            >
                                                <option value="PENDING">Pending</option>
                                                <option value="PROCESSING">Processing</option>
                                                <option value="SHIPPED">Shipped</option>
                                                <option value="DELIVERED">Delivered</option>
                                                <option value="CANCELLED">Cancelled</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
