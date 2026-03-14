'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { API_BASE } from '@/lib/api';
import { Star, Upload, X, Loader2 } from 'lucide-react';

const REFUND_REASONS = [
    { value: 'defective', label: 'Defective Product' },
    { value: 'wrong_item', label: 'Wrong Item Received' },
    { value: 'not_as_described', label: 'Not as Described' },
    { value: 'changed_mind', label: 'Changed Mind' },
    { value: 'other', label: 'Other' }
];

const REFUND_METHODS = [
    { value: 'Original Payment', label: 'Original Payment Method' },
    { value: 'Bank Transfer', label: 'Bank Transfer' },
    { value: 'Store Credit', label: 'Store Credit' }
];

const REFUND_DAYS_WINDOW = 7;

const getStatusBadge = (status: string, refundStatus?: string) => {
    if (status === 'REFUND_REQUESTED' && refundStatus === 'PENDING') {
        return 'bg-orange-100 text-orange-700 border-orange-200';
    }
    if (status === 'REFUNDED' && refundStatus === 'APPROVED') {
        return 'bg-green-100 text-green-700 border-green-200';
    }
    if (status === 'DELIVERED' && refundStatus === 'REJECTED') {
        return 'bg-red-100 text-red-700 border-red-200';
    }
    const styles: Record<string, string> = {
        PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        VERIFIED: 'bg-blue-100 text-blue-700 border-blue-200',
        PROCESSING: 'bg-purple-100 text-purple-700 border-purple-200',
        SHIPPED: 'bg-indigo-100 text-indigo-700 border-indigo-200',
        DELIVERED: 'bg-green-100 text-green-700 border-green-200',
        CANCELLED: 'bg-red-100 text-red-700 border-red-200',
        REFUNDED: 'bg-pink-100 text-pink-700 border-pink-200',
    };
    return styles[status] || 'bg-gray-100 text-gray-700 border-gray-200';
};

const getStatusLabel = (status: string, refundStatus?: string) => {
    if (status === 'REFUND_REQUESTED' && refundStatus === 'PENDING') {
        return 'Refund Requested';
    }
    if (status === 'REFUNDED' && refundStatus === 'APPROVED') {
        return 'Refund Approved';
    }
    if (status === 'DELIVERED' && refundStatus === 'REJECTED') {
        return 'Refund Rejected';
    }
    return status;
};

const canRequestRefund = (order: any) => {
    if (order.status !== 'DELIVERED') return false;
    if (order.refundStatus === 'PENDING') return false;
    if (order.refundStatus === 'APPROVED') return false;
    
    const deliveredAt = order.deliveredAt || order.updatedAt;
    const deliveredDate = new Date(deliveredAt);
    const daysSinceDelivery = Math.floor((new Date().getTime() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return daysSinceDelivery <= REFUND_DAYS_WINDOW;
};

const getDaysRemaining = (order: any) => {
    const deliveredAt = order.deliveredAt || order.updatedAt;
    const deliveredDate = new Date(deliveredAt);
    const daysSinceDelivery = Math.floor((new Date().getTime() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24));
    return REFUND_DAYS_WINDOW - daysSinceDelivery;
};

export default function UserOrdersPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [ratingModal, setRatingModal] = useState<{orderId: number; itemId: number; productName: string} | null>(null);
    const [refundModal, setRefundModal] = useState<{orderId: number; orderTotal: number} | null>(null);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [refundReason, setRefundReason] = useState('');
    const [refundDescription, setRefundDescription] = useState('');
    const [photos, setPhotos] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { user } = useAuth();

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

    useEffect(() => {
        fetchOrders();
        
        const interval = setInterval(fetchOrders, 30000);
        return () => clearInterval(interval);
    }, [user]);

    const submitReview = async () => {
        if (!ratingModal || !user) return;
        setSubmitting(true);
        try {
            const res = await fetch(`${API_BASE}/api/reviews`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-email': user.email
                },
                body: JSON.stringify({
                    orderItemId: ratingModal.itemId,
                    rating,
                    comment: comment || null
                })
            });
            if (res.ok) {
                setRatingModal(null);
                setRating(5);
                setComment('');
                fetchOrders();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to submit review');
            }
        } catch (err) {
            alert('Failed to submit review');
        } finally {
            setSubmitting(false);
        }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        
        setUploading(true);
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (photos.length >= 3) {
                alert('Maximum 3 photos allowed');
                break;
            }
            
            const formData = new FormData();
            formData.append('file', file);
            
            try {
                const res = await fetch(`${API_BASE}/api/upload`, {
                    method: 'POST',
                    body: formData
                });
                
                if (res.ok) {
                    const data = await res.json();
                    setPhotos(prev => [...prev, data.url]);
                } else {
                    const data = await res.json();
                    alert(data.error || 'Failed to upload photo');
                }
            } catch (err) {
                alert('Failed to upload photo');
            }
        }
        
        setUploading(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removePhoto = (index: number) => {
        setPhotos(prev => prev.filter((_, i) => i !== index));
    };

    const submitRefundRequest = async () => {
        if (!refundModal || !user) return;
        if (!refundReason) {
            alert('Please select a reason for refund');
            return;
        }
        
        setSubmitting(true);
        try {
            const res = await fetch(`${API_BASE}/api/orders/${refundModal.orderId}/refund`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-email': user.email
                },
                body: JSON.stringify({
                    reason: refundReason,
                    description: refundDescription || null,
                    photoUrls: photos.length > 0 ? photos : null
                })
            });
            
            if (res.ok) {
                setRefundModal(null);
                setRefundReason('');
                setRefundDescription('');
                setPhotos([]);
                fetchOrders();
                alert('Refund request submitted successfully!');
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to submit refund request');
            }
        } catch (err) {
            alert('Failed to submit refund request');
        } finally {
            setSubmitting(false);
        }
    };

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
                        <a href="/" className="bg-primary text-black px-12 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/30 hover:bg-orange-600 transition-all border-2 border-white/20 active:scale-95">Start Shopping</a>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {orders.map((order, index) => (
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
                                                <div className="flex items-center gap-3">
                                                    {order.status === 'DELIVERED' && !item.rating && (
                                                        <button
                                                            onClick={() => setRatingModal({ orderId: order.id, itemId: item.id, productName: item.product.name })}
                                                            className="text-[10px] font-black uppercase tracking-widest bg-primary text-black px-3 py-1.5 rounded-lg hover:bg-orange-600 transition-all"
                                                        >
                                                            Rate
                                                        </button>
                                                    )}
                                                    {order.status === 'DELIVERED' && item.rating && (
                                                        <div className="flex items-center gap-1">
                                                            {[1, 2, 3, 4, 5].map((star) => (
                                                                <Star key={star} className={`w-3 h-3 ${star <= item.rating ? 'fill-yellow-500 text-yellow-500' : 'text-gray-300'}`} />
                                                            ))}
                                                        </div>
                                                    )}
                                                    <span className="font-black text-secondary bg-gray-50 px-3 py-1 rounded-lg">৳{(item.price * item.quantity).toLocaleString()}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    {(order.status === 'REFUND_REQUESTED' || order.status === 'REFUNDED' || order.refundStatus) && (
                                        <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Refund Status:</span>
                                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm border-2 ${getStatusBadge(order.status, order.refundStatus)}`}>
                                                    {getStatusLabel(order.status, order.refundStatus)}
                                                </span>
                                            </div>
                                            
                                            {order.status === 'REFUND_REQUESTED' && order.refundStatus === 'PENDING' && (
                                                <p className="text-xs text-gray-500">Your refund request is waiting for admin approval.</p>
                                            )}
                                            
                                            {order.status === 'REFUNDED' && order.refundStatus === 'APPROVED' && (
                                                <div className="space-y-1">
                                                    <p className="text-xs text-gray-500">
                                                        <span className="font-bold">Refund Amount:</span> ৳{order.refundAmount?.toLocaleString()}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        <span className="font-bold">Refund Method:</span> {order.refundMethod}
                                                    </p>
                                                </div>
                                            )}
                                            
                                            {order.status === 'DELIVERED' && order.refundStatus === 'REJECTED' && (
                                                <div className="space-y-1">
                                                    <p className="text-xs text-red-500">
                                                        <span className="font-bold">Rejection Reason:</span> {order.refundRejectionReason}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    
                                    <div className="flex flex-col sm:flex-row justify-between items-center pt-8 border-t border-dashed border-gray-100 gap-6">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Status:</span>
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm border-2 ${getStatusBadge(order.status, order.refundStatus)}`}>
                                                {getStatusLabel(order.status, order.refundStatus)}
                                            </span>
                                            
                                            {canRequestRefund(order) && (
                                                <button
                                                    onClick={() => setRefundModal({ orderId: order.id, orderTotal: order.total })}
                                                    className="px-3 py-1.5 bg-red-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-red-600 transition-all"
                                                >
                                                    Request Refund
                                                </button>
                                            )}
                                            
                                            {order.status === 'DELIVERED' && !canRequestRefund(order) && !order.refundStatus && (
                                                <span className="text-[9px] text-gray-400 font-medium">
                                                    (Refund window closed)
                                                </span>
                                            )}
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

            {ratingModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full">
                        <h3 className="text-xl font-black text-secondary mb-4">Rate {ratingModal.productName}</h3>
                        <div className="flex justify-center gap-2 mb-4">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button key={star} onClick={() => setRating(star)}>
                                    <Star className={`w-8 h-8 ${star <= rating ? 'fill-yellow-500 text-yellow-500' : 'text-gray-300'}`} />
                                </button>
                            ))}
                        </div>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Write a review (optional)"
                            className="w-full border border-gray-200 rounded-xl p-3 text-sm mb-4"
                            rows={3}
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => setRatingModal(null)}
                                className="flex-1 py-2 border border-gray-200 rounded-xl font-bold text-gray-500"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitReview}
                                disabled={submitting}
                                className="flex-1 py-2 bg-primary text-black rounded-xl font-bold hover:bg-orange-600 transition-all disabled:opacity-50"
                            >
                                {submitting ? 'Submitting...' : 'Submit'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {refundModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-black text-secondary">Request Refund</h3>
                            <button onClick={() => setRefundModal(null)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Reason for Refund <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={refundReason}
                                    onChange={(e) => setRefundReason(e.target.value)}
                                    className="w-full border border-gray-200 rounded-xl p-3 text-sm"
                                >
                                    <option value="">Select a reason</option>
                                    {REFUND_REASONS.map(r => (
                                        <option key={r.value} value={r.value}>{r.label}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Description (Optional)
                                </label>
                                <textarea
                                    value={refundDescription}
                                    onChange={(e) => setRefundDescription(e.target.value)}
                                    placeholder="Provide additional details about your refund request..."
                                    className="w-full border border-gray-200 rounded-xl p-3 text-sm"
                                    rows={3}
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Photo Evidence (Optional)
                                </label>
                                <p className="text-xs text-gray-500 mb-2">Upload up to 3 photos for defective or damaged items</p>
                                
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {photos.map((photo, idx) => (
                                        <div key={idx} className="relative">
                                            <img src={photo} alt={`Evidence ${idx + 1}`} className="w-20 h-20 object-cover rounded-lg" />
                                            <button
                                                onClick={() => removePhoto(idx)}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                
                                {photos.length < 3 && (
                                    <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl p-4 cursor-pointer hover:border-gray-300 transition-colors">
                                        {uploading ? (
                                            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                                        ) : (
                                            <>
                                                <Upload className="w-5 h-5 text-gray-400" />
                                                <span className="text-sm text-gray-500">Upload Photo</span>
                                            </>
                                        )}
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={handlePhotoUpload}
                                            className="hidden"
                                            disabled={uploading}
                                        />
                                    </label>
                                )}
                            </div>
                            
                            <div className="bg-gray-50 p-4 rounded-xl">
                                <p className="text-xs text-gray-500">
                                    <span className="font-bold">Refund Amount:</span> ৳{refundModal.orderTotal.toLocaleString()}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    <span className="font-bold">Method:</span> Original Payment Method
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setRefundModal(null)}
                                className="flex-1 py-3 border border-gray-200 rounded-xl font-bold text-gray-500"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitRefundRequest}
                                disabled={submitting || !refundReason}
                                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all disabled:opacity-50"
                            >
                                {submitting ? 'Submitting...' : 'Submit Request'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
