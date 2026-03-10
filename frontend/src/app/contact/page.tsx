'use client';

import { useState, useEffect } from 'react';
import { API_BASE } from '@/lib/api';

interface PageData {
    title: string;
    content: string;
    isActive: boolean;
}

export default function ContactPage() {
    const [page, setPage] = useState<PageData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchPage = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/pages/contact`);
                if (!res.ok) {
                    if (res.status === 404) {
                        setError('Page not found');
                    } else {
                        setError('Failed to load page');
                    }
                    return;
                }
                const data = await res.json();
                if (!data.isActive) {
                    setError('This page is currently unavailable');
                    return;
                }
                setPage(data);
            } catch (err) {
                setError('Failed to load page');
            } finally {
                setLoading(false);
            }
        };
        fetchPage();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-700 mb-2">Oops!</h1>
                    <p className="text-gray-500">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-secondary text-black py-16">
                <div className="container mx-auto px-4">
                    <h1 className="text-4xl font-black">{page?.title}</h1>
                </div>
            </div>
            <div className="container mx-auto px-4 py-12">
                <div className="bg-white rounded-2xl shadow-lg p-8 max-w-4xl mx-auto">
                    <div 
                        className="prose prose-lg max-w-none"
                        dangerouslySetInnerHTML={{ __html: page?.content || '' }}
                    />
                </div>
            </div>
        </div>
    );
}
