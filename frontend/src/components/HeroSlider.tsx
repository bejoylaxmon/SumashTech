'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { API_BASE } from '@/lib/api';

interface HeroSlide {
    id: number;
    title: string;
    subtitle: string;
    badge: string;
    price: string;
    cta: string;
    link: string;
    bg: string;
    accent: string;
    image: string;
}

const defaultSlides: HeroSlide[] = [
    {
        id: 1,
        title: "iPhone 16 Pro Max",
        subtitle: "Experience the ultimate Apple innovation. Titanium design. Pro camera system.",
        badge: "New Arrival",
        price: "Starting from ৳165,000",
        cta: "Pre-order Now",
        link: "/category/smartphone-iphone",
        bg: "from-secondary to-gray-800",
        accent: "16",
        image: "https://placehold.co/800x600/111/fff?text=iPhone+16+Pro+Max"
    },
    {
        id: 2,
        title: "MacBook Air M3",
        subtitle: "Strikingly thin. Fast. All-day battery life. The world's best-selling laptop.",
        badge: "Workstation",
        price: "Exclusive Price ৳125,000",
        cta: "Explore Models",
        link: "/category/mac",
        bg: "from-blue-900 to-secondary",
        accent: "M3",
        image: "https://placehold.co/800x600/1e293b/fff?text=MacBook+Air+M3"
    },
    {
        id: 3,
        title: "EcoFlow Delta 2",
        subtitle: "Power for any situation. Fast charging. Reliable portable power station.",
        badge: "Outdoor Gear",
        price: "Special Offer ৳68,000",
        cta: "Buy Now",
        link: "/category/gadgets",
        bg: "from-green-900 to-secondary",
        accent: "SOLAR",
        image: "https://placehold.co/800x600/064e3b/fff?text=EcoFlow+Delta+2"
    }
];

export default function HeroSlider() {
    const [current, setCurrent] = useState(0);
    const [slides, setSlides] = useState<HeroSlide[]>(defaultSlides);

    useEffect(() => {
        const fetchSlides = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/home-settings`);
                if (!res.ok) return;
                const data = await res.json();
                const slides = typeof data.heroSlides === 'string' 
                    ? JSON.parse(data.heroSlides) 
                    : (data.heroSlides || []);
                if (Array.isArray(slides) && slides.length > 0) {
                    setSlides(slides);
                }
            } catch (err) {
                console.error('Failed to fetch hero slides:', err);
            }
        };
        fetchSlides();
    }, []);

    useEffect(() => {
        if (slides.length > 0) {
            const timer = setInterval(() => {
                setCurrent((prev) => (prev + 1) % slides.length);
            }, 5000);
            return () => clearInterval(timer);
        }
    }, [slides]);

    const next = () => setCurrent((prev) => (prev + 1) % slides.length);
    const prev = () => setCurrent((prev) => (prev - 1 + slides.length) % slides.length);

    return (
        <div className="relative h-[400px] md:h-[550px] w-full overflow-hidden rounded-[32px] shadow-2xl group">
            {slides.map((slide, index) => (
                <div
                    key={slide.id}
                    className={`absolute inset-0 transition-all duration-1000 ease-in-out ${index === current ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'
                        }`}
                >
                    <div className={`w-full h-full bg-gradient-to-br ${slide.bg} relative flex items-center px-10 md:px-20`}>
                        {/* Static Pattern */}
                        <div className="absolute top-0 right-0 w-1/2 h-full bg-white/5 skew-x-12 translate-x-1/4"></div>
                        <div className="absolute text-[250px] md:text-[400px] font-black text-white/5 pointer-events-none right-0 bottom-0 select-none leading-none">
                            {slide.accent}
                        </div>

                        <div className="relative z-10 max-w-xl">
                            <span className="inline-block bg-primary/20 text-black text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-full border border-primary/30 mb-6 backdrop-blur-md animate-fade-in">
                                {slide.badge}
                            </span>
                            <h2 className="text-4xl md:text-7xl font-black text-white mb-6 leading-tight animate-slide-up">
                                {slide.title}
                            </h2>
                            <p className="text-gray-300 text-sm md:text-lg mb-8 max-w-md font-medium animate-slide-up delay-100">
                                {slide.subtitle}
                            </p>
                            <div className="mb-10 animate-slide-up delay-200">
                                <span className="text-xl md:text-2xl font-black text-white">{slide.price}</span>
                            </div>
                            <Link
                                href={slide.link}
                                className="inline-flex items-center gap-3 bg-primary text-black font-black px-10 py-5 rounded-2xl hover:bg-orange-600 transition-all shadow-xl shadow-primary/20 group/btn"
                            >
                                {slide.cta}
                                <span className="group-hover:translate-x-1 transition-transform text-black">→</span>
                            </Link>
                        </div>

                        <div className="hidden lg:block absolute right-20 top-1/2 -translate-y-1/2 w-[500px] h-[400px] animate-float">
                            <img src={slide.image} alt={slide.title} className="w-full h-full object-contain filter drop-shadow-2xl" />
                        </div>
                    </div>
                </div>
            ))}

            <button
                onClick={prev}
                className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-white hover:text-secondary opacity-0 group-hover:opacity-100 transition-all z-20"
            >
                ←
            </button>
            <button
                onClick={next}
                className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-white hover:text-secondary opacity-0 group-hover:opacity-100 transition-all z-20"
            >
                →
            </button>

            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-20">
                {slides.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setCurrent(i)}
                        className={`h-1.5 rounded-full transition-all ${i === current ? 'w-8 bg-primary' : 'w-2 bg-white/30 truncate'
                            }`}
                    ></button>
                ))}
            </div>
        </div>
    );
}
