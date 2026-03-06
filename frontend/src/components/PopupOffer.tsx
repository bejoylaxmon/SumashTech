'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { API_BASE } from '@/lib/api';

interface PopupData {
    id: number;
    title: string;
    description: string;
    image?: string;
    link?: string;
    isActive: boolean;
}

export default function PopupOffer() {
    const [popup, setPopup] = useState<PopupData | null>(null);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const hasSeenPopup = sessionStorage.getItem('hasSeenPopup');
        if (hasSeenPopup) return;

        const fetchPopup = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/promotions/popup`);
                const data = await res.json();
                if (data.id && data.isActive) {
                    setPopup(data);
                    setIsOpen(true);
                }
            } catch (err) {
                console.error('Failed to fetch popup offer:', err);
            }
        };

        fetchPopup();
    }, []);

    const closePopup = () => {
        setIsOpen(false);
        sessionStorage.setItem('hasSeenPopup', 'true');
    };

    if (!isOpen || !popup) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden relative animate-in zoom-in-95 duration-300">
                <button
                    onClick={closePopup}
                    className="absolute top-4 right-4 bg-white/80 hover:bg-white rounded-full p-2 h-10 w-10 flex items-center justify-center shadow-lg transition-all z-10"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {popup.image && (
                    <div className="relative h-64 w-full">
                        <Image
                            src={popup.image}
                            alt={popup.title}
                            fill
                            className="object-cover"
                        />
                    </div>
                )}

                <div className="p-8 text-center">
                    <h2 className="text-3xl font-bold text-secondary mb-3">{popup.title}</h2>
                    <p className="text-gray-600 mb-8 leading-relaxed">{popup.description}</p>

                    <div className="flex flex-col gap-3">
                        {popup.link && (
                            <a
                                href={popup.link}
                                onClick={closePopup}
                                className="bg-primary text-white font-bold py-4 px-8 rounded-xl hover:bg-primary/90 transition-all text-lg shadow-lg shadow-primary/20"
                            >
                                Get Offer Now
                            </a>
                        )}
                        <button
                            onClick={closePopup}
                            className="text-gray-400 hover:text-gray-600 text-sm font-medium transition-colors"
                        >
                            No thanks, continue browsing
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
