'use client';

import { useState } from 'react';
import Link from 'next/link';

interface OrderItem {
  id: number;
  quantity: number;
  price: number;
  product: {
    name: string;
    images: string[];
  };
}

interface Order {
  id: number;
  total: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
}

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId) return;

    setLoading(true);
    setError('');
    setOrder(null);

    try {
      const res = await fetch(`http://localhost:54321/api/orders/${orderId}`);

      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('Order not found');
        }
        throw new Error('Failed to fetch order');
      }

      const data = await res.json();
      setOrder(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'DELIVERED': return 'bg-green-100 text-green-800';
      case 'SHIPPED': return 'bg-blue-100 text-blue-800';
      case 'PROCESSING': return 'bg-yellow-100 text-yellow-800';
      case 'PENDING': return 'bg-gray-100 text-gray-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-16">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-secondary mb-4 uppercase tracking-[0.1em]">Track Order</h1>
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em]">Enter your reference number below</p>
        </div>

        <form onSubmit={handleTrack} className="mb-12">
          <div className="flex flex-col sm:flex-row gap-4 bg-white p-3 rounded-[32px] shadow-xl shadow-gray-200/50 border border-gray-100">
            <input
              type="text"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="Order ID (e.g. 101)"
              className="flex-grow bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-black text-secondary outline-none focus:ring-4 ring-primary/10 transition-all"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-primary text-white font-black px-10 py-4 rounded-2xl hover:bg-orange-600 transition-all disabled:opacity-50 shadow-xl shadow-primary/30 uppercase tracking-widest text-xs border-2 border-white/20 active:scale-95"
            >
              {loading ? 'Searching...' : 'Locate Order'}
            </button>
          </div>
        </form>

        {error && (
          <div className="bg-red-500 text-white p-6 rounded-3xl text-center mb-10 font-black uppercase tracking-widest text-[10px] shadow-xl shadow-red-200 animate-shake">
            ⚠️ {error}
          </div>
        )}

        {order && (
          <div className="bg-white rounded-[40px] shadow-2xl shadow-gray-200/60 border border-gray-100 overflow-hidden animate-fade-in-up">
            <div className="p-10 border-b border-gray-100 flex flex-wrap justify-between items-center bg-gray-50/50 gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-md border border-gray-100 font-black text-primary text-xl">#</div>
                <div>
                  <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest block mb-1">Reference</span>
                  <span className="font-black text-secondary text-2xl tracking-tight">#{order.id}</span>
                </div>
              </div>
              <div className={`px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-[0.2em] shadow-md border-2 border-white ${getStatusColor(order.status)}`}>
                {order.status}
              </div>
            </div>

            <div className="p-10">
              <h3 className="font-black text-secondary uppercase tracking-widest text-xs flex items-center gap-2 mb-8">
                <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                Package Details
              </h3>
              <div className="space-y-8">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-6 group">
                    <div className="w-20 h-20 bg-gray-50 rounded-2xl overflow-hidden flex-shrink-0 relative border border-gray-100 group-hover:scale-105 transition-transform">
                      <div className="absolute inset-0 flex items-center justify-center text-3xl opacity-50">📱</div>
                    </div>
                    <div className="flex-grow">
                      <h4 className="font-black text-secondary text-lg group-hover:text-primary transition-colors leading-tight mb-1">{item.product.name}</h4>
                      <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Quantity: {item.quantity} × ৳{item.price.toLocaleString()}</p>
                    </div>
                    <div className="font-black text-secondary bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                      ৳{(item.quantity * item.price).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-12 pt-10 border-t border-dashed border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-6">
                <div>
                  <span className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] block mb-1">Amount Paid</span>
                  <span className="font-black text-4xl text-primary tracking-tighter">৳{order.total.toLocaleString()}</span>
                </div>
                <Link href="/" className="bg-secondary text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-black transition-all shadow-xl shadow-secondary/20">Return to Store</Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
