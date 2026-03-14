'use client';

import { useState, useEffect } from 'react';
import { API_BASE } from '@/lib/api';
import { X } from 'lucide-react';

const ORDER_STATUSES = ['PENDING', 'VERIFIED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'REFUND_REQUESTED', 'CANCELLED', 'REFUNDED'];
const SHIPPING_STATUSES = ['Pending', 'Packed', 'Handed to Courier', 'In Transit', 'Delivered'];
const COURIERS = ['Pathao', 'Steadfast', 'RedX', 'SSL Commercial', 'Others'];
const REFUND_METHODS = [
    { value: 'Original Payment', label: 'Original Payment Method' },
    { value: 'Bank Transfer', label: 'Bank Transfer' },
    { value: 'Store Credit', label: 'Store Credit' }
];
const REFUND_REASONS = [
    { value: 'defective', label: 'Defective Product' },
    { value: 'wrong_item', label: 'Wrong Item Received' },
    { value: 'not_as_described', label: 'Not as Described' },
    { value: 'changed_mind', label: 'Changed Mind' },
    { value: 'other', label: 'Other' }
];

const getRefundReasonLabel = (value: string) => {
    const reason = REFUND_REASONS.find(r => r.value === value);
    return reason ? reason.label : value;
};

const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
        PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        VERIFIED: 'bg-blue-100 text-blue-700 border-blue-200',
        PROCESSING: 'bg-purple-100 text-purple-700 border-purple-200',
        SHIPPED: 'bg-indigo-100 text-indigo-700 border-indigo-200',
        DELIVERED: 'bg-green-100 text-green-700 border-green-200',
        REFUND_REQUESTED: 'bg-orange-100 text-orange-700 border-orange-200',
        CANCELLED: 'bg-red-100 text-red-700 border-red-200',
        REFUNDED: 'bg-pink-100 text-pink-700 border-pink-200',
    };
    return styles[status] || 'bg-gray-100 text-gray-700 border-gray-200';
};

const getShippingBadge = (status: string) => {
    const styles: Record<string, string> = {
        'Pending': 'bg-gray-100 text-gray-600 border-gray-200',
        'Packed': 'bg-orange-100 text-orange-700 border-orange-200',
        'Handed to Courier': 'bg-cyan-100 text-cyan-700 border-cyan-200',
        'In Transit': 'bg-indigo-100 text-indigo-700 border-indigo-200',
        'Delivered': 'bg-green-100 text-green-700 border-green-200',
    };
    return styles[status] || 'bg-gray-100 text-gray-700 border-gray-200';
};

const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + 
           date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [showRefundModal, setShowRefundModal] = useState(false);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [submitting, setSubmitting] = useState(false);

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
            setShowStatusModal(false);
            setSelectedOrder(null);
        } catch (err) {
            alert('Failed to update order');
        }
    };

    const processRefund = async (orderId: number, action: 'approve' | 'reject', data: any) => {
        setSubmitting(true);
        try {
            const apiBase = API_BASE;
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const res = await fetch(`${apiBase}/api/admin/orders/${orderId}/refund`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-email': user.email
                },
                body: JSON.stringify({ action, ...data }),
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to process refund');
            }
            fetchOrders();
            setShowRefundModal(false);
            setSelectedOrder(null);
            alert(action === 'approve' ? 'Refund approved successfully!' : 'Refund rejected!');
        } catch (err: any) {
            alert(err.message || 'Failed to process refund');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredOrders = statusFilter === 'ALL' ? orders : orders.filter(o => o.status === statusFilter);

    const getTrackingUrl = (courierName: string, trackingNumber: string) => {
        if (!courierName || !trackingNumber) return '#';
        if (courierName === 'Pathao') return `https://pathao.com/tracking/${trackingNumber}`;
        if (courierName === 'Steadfast') return `https://steadfast.com.bd/t/${trackingNumber}`;
        if (courierName === 'RedX') return `https://redx.com.bd/tracking/?trackingId=${trackingNumber}`;
        return '#';
    };

    if (loading) return <div className="p-10 text-center">Loading orders...</div>;
    if (error) return <div className="p-10 text-center text-red-500 font-bold">Error: {error}</div>;

    return (
        <div className="bg-gray-50 min-h-screen py-8">
            <div className="container mx-auto px-4 max-w-[98%]">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-secondary uppercase tracking-widest flex items-center gap-3">
                            <span className="w-2 h-8 bg-primary rounded-full"></span>
                            Order Management
                        </h1>
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em] mt-2 ml-5">Logistics & fulfillment Control</p>
                    </div>
                    <div className="flex gap-3 items-center">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-white px-5 py-3 rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 text-xs font-bold uppercase tracking-wider outline-none"
                        >
                            <option value="ALL">All Orders</option>
                            {ORDER_STATUSES.map(s => (
                                <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase().replace('_', ' ')}</option>
                            ))}
                        </select>
                        <div className="bg-white px-6 py-3 rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 flex flex-col justify-center">
                            <span className="text-gray-400 text-[9px] font-black uppercase tracking-widest block mb-1">Total Queue</span>
                            <span className="text-xl font-black text-secondary">{filteredOrders.length}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/60 border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/80 border-b border-gray-100">
                                    <th className="px-4 py-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.15em]">Order ID</th>
                                    <th className="px-4 py-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.15em]">Customer</th>
                                    <th className="px-4 py-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.15em]">Items</th>
                                    <th className="px-4 py-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.15em]">Total</th>
                                    <th className="px-4 py-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.15em]">Payment</th>
                                    <th className="px-4 py-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.15em]">Order Status</th>
                                    <th className="px-4 py-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.15em]">Shipping</th>
                                    <th className="px-4 py-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.15em]">Courier</th>
                                    <th className="px-4 py-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.15em]">Created</th>
                                    <th className="px-4 py-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.15em]">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50/60 transition-colors group">
                                        <td className="px-4 py-4">
                                            <div className="bg-secondary/5 w-10 h-10 rounded-lg flex items-center justify-center font-black text-secondary text-sm">
                                                #{order.id}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="font-bold text-secondary text-sm">{order.user?.name || 'N/A'}</div>
                                            <div className="text-gray-400 text-[10px] font-medium mt-0.5">📞 {order.phone || 'N/A'}</div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="font-bold text-secondary">{order.items?.length || 0}</span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="font-black text-secondary text-sm">৳{order.total?.toLocaleString()}</span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md ${
                                                order.paymentMethod === 'BKASH' ? 'bg-pink-100 text-pink-600' :
                                                order.paymentMethod === 'CARD' ? 'bg-blue-100 text-blue-600' :
                                                order.paymentMethod === 'MOBILE_BANKING' ? 'bg-purple-100 text-purple-600' :
                                                'bg-gray-100 text-gray-600'
                                            }`}>
                                                {order.paymentMethod}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className={`text-[9px] font-bold uppercase px-3 py-1.5 rounded-full border-2 ${getStatusBadge(order.status)}`}>
                                                    {order.status.replace('_', ' ')}
                                                </span>
                                                {order.refundStatus && order.refundStatus !== 'PENDING' && (
                                                    <span className={`text-[9px] font-bold uppercase px-3 py-1.5 rounded-full border-2 ${
                                                        order.refundStatus === 'APPROVED' ? 'bg-green-100 text-green-700 border-green-200' :
                                                        'bg-red-100 text-red-700 border-red-200'
                                                    }`}>
                                                        Refund {order.refundStatus}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={`text-[9px] font-bold uppercase px-3 py-1.5 rounded-full border-2 ${getShippingBadge(order.shippingStatus || 'Pending')}`}>
                                                {order.shippingStatus || 'Pending'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            {order.courierName ? (
                                                <a
                                                    href={getTrackingUrl(order.courierName, order.trackingNumber)}
                                                    target="_blank"
                                                    className="text-[10px] font-bold text-primary hover:underline"
                                                >
                                                    {order.courierName} {order.trackingNumber && `(${order.trackingNumber})`}
                                                </a>
                                            ) : (
                                                <span className="text-[10px] text-gray-300">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="text-[10px] font-medium text-gray-500">{formatDate(order.createdAt)}</span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex flex-wrap gap-1.5">
                                                {order.status === 'REFUND_REQUESTED' && order.refundStatus === 'PENDING' && (
                                                    <button
                                                        onClick={() => { setSelectedOrder(order); setShowRefundModal(true); }}
                                                        className="px-2.5 py-1.5 bg-orange-500 text-white text-[9px] font-bold uppercase rounded-md hover:bg-orange-600 transition-colors"
                                                    >
                                                        Review Refund
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => { setSelectedOrder(order); setShowStatusModal(true); }}
                                                    className="px-2.5 py-1.5 bg-primary text-white text-[9px] font-bold uppercase rounded-md hover:bg-primary/90 transition-colors"
                                                >
                                                    Update
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        const url = prompt('Enter Invoice URL', order.invoiceUrl || '');
                                                        if (url) updateOrder(order.id, { invoiceUrl: url });
                                                    }}
                                                    className="px-2.5 py-1.5 bg-indigo-500 text-white text-[9px] font-bold uppercase rounded-md hover:bg-indigo-600 transition-colors"
                                                >
                                                    Invoice
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        const printWindow = window.open('', '_blank');
                                                        if (printWindow) {
                                                            printWindow.document.write(`
                                                                <html>
                                                                    <head><title>Invoice #${order.id}</title>
                                                                    <style>
                                                                        body { font-family: sans-serif; padding: 40px; }
                                                                        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 20px; }
                                                                        .details { margin: 20px 0; }
                                                                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                                                                        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                                                                        .total { text-align: right; font-size: 1.2em; font-weight: bold; margin-top: 20px; }
                                                                    </style></head>
                                                                    <body>
                                                                        <div class="header"><div><h1>Sumash Tech</h1><p>Invoice #${order.id}</p></div>
                                                                        <div><p>Date: ${new Date(order.createdAt).toLocaleDateString()}</p></div></div>
                                                                        <div class="details"><h3>Customer Info:</h3><p>Name: ${order.user?.name}</p><p>Address: ${order.address}</p><p>Phone: ${order.phone}</p></div>
                                                                        <table><thead><tr><th>Item</th><th>Qty</th><th>Price</th></tr></thead>
                                                                        <tbody>${order.items?.map((item: any) => `<tr><td>${item.product?.name || 'Product ' + item.productId}</td><td>${item.quantity}</td><td>৳${item.price}</td></tr>`).join('')}</tbody></table>
                                                                        <div class="total">Total: ৳${order.total}</div>
                                                                        <script>window.print();</script></body></html>
                                                            `);
                                                            printWindow.document.close();
                                                        }
                                                    }}
                                                    className="px-2.5 py-1.5 bg-gray-500 text-white text-[9px] font-bold uppercase rounded-md hover:bg-gray-600 transition-colors"
                                                >
                                                    Print
                                                </button>
                                                {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && order.status !== 'REFUNDED' && order.status !== 'REFUND_REQUESTED' && (
                                                    <button
                                                        onClick={() => {
                                                            if (confirm('Cancel this order?')) {
                                                                updateOrder(order.id, { status: 'CANCELLED' });
                                                            }
                                                        }}
                                                        className="px-2.5 py-1.5 bg-red-500 text-white text-[9px] font-bold uppercase rounded-md hover:bg-red-600 transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
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

            {showRefundModal && selectedOrder && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-black text-secondary">Refund Request - Order #{selectedOrder.id}</h2>
                            <button onClick={() => { setShowRefundModal(false); setSelectedOrder(null); }} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="bg-gray-50 p-4 rounded-xl">
                                <h3 className="font-bold text-sm text-gray-500 uppercase mb-2">Customer Info</h3>
                                <p className="font-bold text-secondary">{selectedOrder.user?.name}</p>
                                <p className="text-sm text-gray-500">{selectedOrder.phone}</p>
                            </div>
                            
                            <div className="bg-gray-50 p-4 rounded-xl">
                                <h3 className="font-bold text-sm text-gray-500 uppercase mb-2">Order Details</h3>
                                <p className="text-sm"><span className="font-bold">Total:</span> ৳{selectedOrder.total?.toLocaleString()}</p>
                                <p className="text-sm"><span className="font-bold">Payment:</span> {selectedOrder.paymentMethod}</p>
                                <p className="text-sm"><span className="font-bold">Requested:</span> {selectedOrder.refundRequestDate ? formatDate(selectedOrder.refundRequestDate) : 'N/A'}</p>
                            </div>
                            
                            <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
                                <h3 className="font-bold text-sm text-orange-700 uppercase mb-2">Refund Request</h3>
                                <p className="text-sm"><span className="font-bold">Reason:</span> {getRefundReasonLabel(selectedOrder.refundReason)}</p>
                                {selectedOrder.refundDescription && (
                                    <p className="text-sm mt-2"><span className="font-bold">Description:</span> {selectedOrder.refundDescription}</p>
                                )}
                            </div>
                            
                            {selectedOrder.refundEvidencePhotos && (
                                <div>
                                    <h3 className="font-bold text-sm text-gray-500 uppercase mb-2">Evidence Photos</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {JSON.parse(selectedOrder.refundEvidencePhotos).map((photo: string, idx: number) => (
                                            <a key={idx} href={photo} target="_blank" rel="noopener noreferrer">
                                                <img src={photo} alt={`Evidence ${idx + 1}`} className="w-20 h-20 object-cover rounded-lg border border-gray-200 hover:opacity-80" />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            <hr className="my-4" />
                            
                            <div>
                                <h3 className="font-bold text-lg text-secondary mb-4">Process Refund</h3>
                                
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Refund Amount</label>
                                        <input
                                            id="refundAmount"
                                            type="number"
                                            defaultValue={selectedOrder.total}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-bold outline-none focus:border-primary"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Refund Method</label>
                                        <select
                                            id="refundMethod"
                                            defaultValue="Original Payment"
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-bold outline-none focus:border-primary"
                                        >
                                            {REFUND_METHODS.map(m => (
                                                <option key={m.value} value={m.value}>{m.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                
                                <div className="flex gap-3 mt-6">
                                    <button
                                        onClick={() => {
                                            const refundAmount = parseFloat((document.getElementById('refundAmount') as HTMLInputElement).value);
                                            const refundMethod = (document.getElementById('refundMethod') as HTMLSelectElement).value;
                                            processRefund(selectedOrder.id, 'approve', { refundAmount, refundMethod });
                                        }}
                                        disabled={submitting}
                                        className="flex-1 px-4 py-3 bg-green-500 text-white text-sm font-bold uppercase rounded-xl hover:bg-green-600 transition-colors disabled:opacity-50"
                                    >
                                        {submitting ? 'Processing...' : 'Approve Refund'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            const reason = prompt('Enter rejection reason:');
                                            if (reason) {
                                                processRefund(selectedOrder.id, 'reject', { rejectionReason: reason });
                                            }
                                        }}
                                        disabled={submitting}
                                        className="flex-1 px-4 py-3 bg-red-500 text-white text-sm font-bold uppercase rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50"
                                    >
                                        Reject
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showStatusModal && selectedOrder && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <h2 className="text-xl font-black text-secondary mb-4">Update Order #{selectedOrder.id}</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Order Status</label>
                                <select
                                    id="orderStatus"
                                    defaultValue={selectedOrder.status}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-bold outline-none focus:border-primary"
                                >
                                    {ORDER_STATUSES.map(s => (
                                        <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase().replace('_', ' ')}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Shipping Status</label>
                                <select
                                    id="shippingStatus"
                                    defaultValue={selectedOrder.shippingStatus || 'Pending'}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-bold outline-none focus:border-primary"
                                >
                                    {SHIPPING_STATUSES.map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Courier</label>
                                <select
                                    id="courierName"
                                    defaultValue={selectedOrder.courierName || ''}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-bold outline-none focus:border-primary"
                                >
                                    <option value="">Select Courier</option>
                                    {COURIERS.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Tracking Number</label>
                                <input
                                    id="trackingNumber"
                                    type="text"
                                    defaultValue={selectedOrder.trackingNumber || ''}
                                    placeholder="Enter tracking number"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-bold outline-none focus:border-primary"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => { setShowStatusModal(false); setSelectedOrder(null); }}
                                className="flex-1 px-4 py-3 bg-gray-100 text-gray-600 text-sm font-bold uppercase rounded-xl hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    const status = (document.getElementById('orderStatus') as HTMLSelectElement).value;
                                    const shippingStatus = (document.getElementById('shippingStatus') as HTMLSelectElement).value;
                                    const courierName = (document.getElementById('courierName') as HTMLSelectElement).value;
                                    const trackingNumber = (document.getElementById('trackingNumber') as HTMLInputElement).value;
                                    updateOrder(selectedOrder.id, { status, shippingStatus, courierName, trackingNumber });
                                }}
                                className="flex-1 px-4 py-3 bg-primary text-white text-sm font-bold uppercase rounded-xl hover:bg-primary/90 transition-colors"
                            >
                                Update
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
