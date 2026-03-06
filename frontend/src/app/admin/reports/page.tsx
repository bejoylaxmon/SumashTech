'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function AdminReportsPage() {
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        const fetchReport = async () => {
            try {
                const res = await fetch('http://localhost:54321/api/admin/reports/sales', {
                    headers: { 'x-user-email': user?.email || '' }
                });
                setReport(await res.json());
            } finally {
                setLoading(false);
            }
        };
        if (user) fetchReport();
    }, [user]);

    if (loading) return <div className="p-10 text-center font-bold">Loading Reports...</div>;

    return (
        <div className="bg-gray-50 min-h-screen py-12">
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="mb-12">
                    <h1 className="text-4xl font-black text-secondary uppercase tracking-widest flex items-center gap-3">
                        <span className="w-2 h-10 bg-primary rounded-full"></span>
                        Executive Dashboard
                    </h1>
                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em] mt-3 ml-5">Sales Intelligence & Analytics</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                    <div className="bg-white p-8 rounded-[32px] shadow-xl shadow-gray-200/50 border border-gray-100 flex flex-col justify-between">
                        <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-4 block">Settled Revenue</span>
                        <h2 className="text-3xl font-black text-secondary">৳{report?.totalSales?.toLocaleString()}</h2>
                        <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                            <span className="text-[10px] font-black text-green-500 bg-green-50 px-2 py-1 rounded-lg uppercase">Delivered Only</span>
                        </div>
                    </div>
                    <div className="bg-white p-8 rounded-[32px] shadow-xl shadow-gray-200/50 border border-gray-100 flex flex-col justify-between">
                        <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-4 block">Active Orders</span>
                        <h2 className="text-3xl font-black text-secondary">{report?.orderCount}</h2>
                        <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                            <span className="text-[10px] font-black text-blue-500 bg-blue-50 px-2 py-1 rounded-lg uppercase">All Statuses</span>
                        </div>
                    </div>
                    <div className="bg-white p-8 rounded-[32px] shadow-xl shadow-gray-200/50 border border-gray-100 flex flex-col justify-between">
                        <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-4 block">Conversion Rate</span>
                        <h2 className="text-3xl font-black text-secondary">
                            {report?.orderCount > 0 ? ((report.deliveredCount / report.orderCount) * 100).toFixed(1) : 0}%
                        </h2>
                        <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                            <span className="text-[10px] font-black text-purple-500 bg-purple-50 px-2 py-1 rounded-lg uppercase">Success Rate</span>
                        </div>
                    </div>
                    <div className="bg-white p-8 rounded-[32px] shadow-xl shadow-gray-200/50 border border-gray-100 flex flex-col justify-between">
                        <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-4 block">Avg Ticket Size</span>
                        <h2 className="text-3xl font-black text-secondary">
                            ৳{report?.deliveredCount > 0 ? (report.totalSales / report.deliveredCount).toFixed(0) : 0}
                        </h2>
                        <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                            <span className="text-[10px] font-black text-orange-500 bg-orange-50 px-2 py-1 rounded-lg uppercase">Per Delivered</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-white rounded-[40px] shadow-2xl shadow-gray-200/60 border border-gray-100 p-10">
                        <h3 className="text-xl font-black text-secondary uppercase tracking-widest flex items-center gap-3 mb-10">
                            <span className="w-1.5 h-6 bg-green-500 rounded-full"></span>
                            Recent Settled Sales
                        </h3>
                        <div className="space-y-6">
                            {report?.orders?.length > 0 ? report.orders.map((o: any, i: number) => (
                                <div key={i} className="flex justify-between items-center p-6 bg-gray-50 rounded-2xl hover:bg-gray-100/50 transition-colors border border-transparent hover:border-gray-200 group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center font-black text-gray-400 group-hover:text-primary transition-colors shadow-sm">#{i + 1}</div>
                                        <div>
                                            <p className="font-black text-secondary group-hover:translate-x-1 transition-transform">Transaction Recorded</p>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{new Date(o.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                        </div>
                                    </div>
                                    <span className="text-xl font-black text-primary">৳{o.total.toLocaleString()}</span>
                                </div>
                            )) : (
                                <div className="text-center py-10 text-gray-400 font-black uppercase text-xs tracking-widest">No settled sales yet</div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-[40px] shadow-2xl shadow-gray-200/60 border border-gray-100 p-10">
                        <h3 className="text-xl font-black text-secondary uppercase tracking-widest flex items-center gap-3 mb-10">
                            <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span>
                            Order Status Breakdown
                        </h3>
                        <div className="space-y-4">
                            {report?.statusCounts && Object.entries(report.statusCounts).map(([status, count]: [string, any]) => (
                                <div key={status} className="flex justify-between items-center p-5 bg-gray-50 rounded-2xl border border-gray-100">
                                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${status === 'DELIVERED' ? 'bg-green-500 text-white' :
                                            status === 'CANCELLED' ? 'bg-red-500 text-white' :
                                                'bg-blue-500 text-white'
                                        }`}>{status}</span>
                                    <span className="font-black text-secondary text-xl font-mono">{count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
