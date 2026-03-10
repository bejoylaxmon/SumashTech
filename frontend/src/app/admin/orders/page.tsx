'use client';

import { useState, useEffect } from 'react';
import { API_BASE } from '@/lib/api';

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userPerms, setUserPerms] = useState<string[]>([]);

    const fetchOrders = async () => {
        try {
            const apiBase = API_BASE;
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

            const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
            setUserPerms(storedUser.permissions || []);
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

    const updateOrder = async (orderId: number, data: any) => {
        try {
            const apiBase = API_BASE;
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const res = await fetch(`${apiBase}/api/admin/orders/${orderId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-email': user.email
                },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Update failed');
            fetchOrders();
        } catch (err) {
            alert('Failed to update order');
        }
    };

    const hasPerm = (p: string) => userPerms.includes(p) || userPerms.includes('delete_refund_order');

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
                        <select
                            onChange={(e) => {
                                const val = e.target.value;
                                if (val === 'ALL') fetchOrders();
                                else setOrders(orders.filter(o => o.status === val));
                            }}
                            className="bg-white px-6 py-4 rounded-[24px] shadow-xl shadow-gray-200/50 border border-gray-100 text-[10px] font-black uppercase tracking-widest outline-none"
                        >
                            <option value="ALL">All Orders</option>
                            <option value="PENDING">Pending (Sales Queue)</option>
                            <option value="VERIFIED">Verified (Manager Queue)</option>
                            <option value="SHIPPED">Shipped (In Transit)</option>
                            <option value="DELIVERED">Delivered</option>
                        </select>
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
                                    <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Audit Info</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Status</th>
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
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                                    {order.verifiedBy?.name ? `Verified: ${order.verifiedBy.name}` : 'Verification Pending'}
                                                </span>
                                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                                    {order.shippedBy?.name ? `Shipped: ${order.shippedBy.name}` : 'Shipping Pending'}
                                                </span>
                                                {order.trackingNumber && (
                                                    <a
                                                        href={
                                                            order.courierName === 'Pathao' ? `https://pathao.com/tracking/${order.trackingNumber}` :
                                                                order.courierName === 'Steadfast' ? `https://steadfast.com.bd/t/${order.trackingNumber}` :
                                                                    order.courierName === 'RedX' ? `https://redx.com.bd/tracking/?trackingId=${order.trackingNumber}` :
                                                                        '#'
                                                        }
                                                        target="_blank"
                                                        className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline mt-1 flex items-center gap-1"
                                                    >
                                                        🚚 {order.courierName}: {order.trackingNumber} ↗
                                                    </a>
                                                )}
                                                <span className={`text-[10px] font-black uppercase tracking-widest mt-1 ${order.paymentMethod === 'BKASH' ? 'text-pink-600' : 'text-blue-600'}`}>
                                                    {order.paymentMethod}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg border-2 border-white ${order.status === 'DELIVERED' ? 'bg-green-500 text-black shadow-green-200' :
                                                order.status === 'CANCELLED' ? 'bg-red-500 text-black shadow-red-200' :
                                                    order.status === 'SHIPPED' ? 'bg-blue-500 text-black shadow-blue-200' :
                                                        order.status === 'VERIFIED' ? 'bg-indigo-500 text-black shadow-indigo-200' :
                                                            'bg-yellow-400 text-black shadow-yellow-200'
                                                }`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="flex flex-wrap gap-2">
                                                {hasPerm('verify_order_status') && order.status === 'PENDING' && (
                                                    <button onClick={() => updateOrder(order.id, { status: 'VERIFIED' })}
                                                        className="px-4 py-2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-colors">
                                                        Verify
                                                    </button>
                                                )}

                                                {hasPerm('assign_courier') && order.status === 'VERIFIED' && (
                                                    <button onClick={() => {
                                                        const courier = prompt('Select Courier (Pathao, Steadfast, RedX)', 'Pathao');
                                                        const tracking = prompt('Enter Tracking Number');
                                                        if (courier && tracking) updateOrder(order.id, { courierName: courier, trackingNumber: tracking, status: 'SHIPPED' });
                                                    }}
                                                        className="px-4 py-2 bg-purple-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-purple-700 transition-colors">
                                                        Ship
                                                    </button>
                                                )}

                                                {(hasPerm('verify_order_status') || hasPerm('assign_courier')) && order.status === 'SHIPPED' && (
                                                    <button onClick={() => {
                                                        if (confirm('Mark this order as DELIVERED? Warranty will start today.')) {
                                                            updateOrder(order.id, { status: 'DELIVERED' });
                                                        }
                                                    }}
                                                        className="px-4 py-2 bg-green-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-green-700 transition-colors">
                                                        Mark Delivered
                                                    </button>
                                                )}

                                                {hasPerm('generate_invoice') && (
                                                    <>
                                                        <button onClick={() => {
                                                            const url = prompt('Enter Invoice URL');
                                                            if (url) updateOrder(order.id, { invoiceUrl: url });
                                                        }}
                                                            className="px-4 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-colors">
                                                            Invoice Link
                                                        </button>
                                                        <button onClick={() => {
                                                            const printWindow = window.open('', '_blank');
                                                            if (printWindow) {
                                                                printWindow.document.write(`
                                                                    <html>
                                                                        <head>
                                                                            <title>Invoice #${order.id}</title>
                                                                            <style>
                                                                                body { font-family: sans-serif; padding: 40px; }
                                                                                .header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 20px; }
                                                                                .details { margin: 20px 0; }
                                                                                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                                                                                th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                                                                                .total { text-align: right; font-size: 1.2em; font-weight: bold; margin-top: 20px; }
                                                                            </style>
                                                                        </head>
                                                                        <body>
                                                                            <div class="header">
                                                                                <div><h1>Sumash Tech</h1><p>Invoice #${order.id}</p></div>
                                                                                <div><p>Date: ${new Date(order.createdAt).toLocaleDateString()}</p></div>
                                                                            </div>
                                                                            <div class="details">
                                                                                <h3>Customer Info:</h3>
                                                                                <p>Address: ${order.address}</p>
                                                                                <p>Phone: ${order.phone}</p>
                                                                            </div>
                                                                            <table>
                                                                                <thead><tr><th>Item</th><th>Price</th></tr></thead>
                                                                                <tbody>${order.items?.map((item: any) => `<tr><td>Product ID ${item.productId}</td><td>৳${item.price}</td></tr>`).join('')}</tbody>
                                                                            </table>
                                                                            <div class="total">Total: ৳${order.total}</div>
                                                                            <script>window.print();</script>
                                                                        </body>
                                                                    </html>
                                                                `);
                                                                printWindow.document.close();
                                                            }
                                                        }}
                                                            className="px-4 py-2 bg-gray-600 text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-gray-700 transition-colors">
                                                            Print
                                                        </button>
                                                    </>
                                                )}

                                                {hasPerm('delete_refund_order') && (
                                                    <>
                                                        <button onClick={() => updateOrder(order.id, { status: 'CANCELLED' })}
                                                            className="px-4 py-2 bg-red-600 text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-700 transition-colors">
                                                            Refund
                                                        </button>
                                                        <button onClick={() => {
                                                            if (confirm('Delete this order permanently?')) {
                                                                // Implementation for delete would go here
                                                                alert('Delete action triggered (Backend implementation pending for DELETE route)');
                                                            }
                                                        }}
                                                            className="px-4 py-2 border-2 border-red-600 text-red-600 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-50 transition-colors">
                                                            Delete
                                                        </button>
                                                    </>
                                                )}

                                                {!hasPerm('verify_order_status') && !hasPerm('assign_courier') && !hasPerm('generate_invoice') && !hasPerm('delete_refund_order') && (
                                                    <span className="text-[10px] font-black text-gray-300 uppercase italic">View Only</span>
                                                )}
                                            </div>
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
