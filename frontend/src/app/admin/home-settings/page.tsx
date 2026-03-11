'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
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

interface HomeSettings {
    id: number;
    phone: string;
    address: string;
    heroSlides: HeroSlide[];
}

interface PageContent {
    id: number;
    slug: string;
    title: string;
    content: string;
    isActive: boolean;
}

const cmsPages = [
    { slug: 'about', label: 'About Us' },
    { slug: 'contact', label: 'Contact' },
    { slug: 'terms', label: 'Terms & Conditions' },
    { slug: 'privacy', label: 'Privacy Policy' },
    { slug: 'shipping', label: 'Shipping Policy' },
    { slug: 'return-policy', label: 'Return Policy' },
    { slug: 'faq', label: 'FAQ' },
    { slug: 'support', label: 'Support' }
];

export default function HomeSettingsPage() {
    const { user } = useAuth();
    const [settings, setSettings] = useState<HomeSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [activeTab, setActiveTab] = useState<'company' | 'hero' | 'pages' | 'popup'>('company');

    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);

    const [pages, setPages] = useState<PageContent[]>([]);
    const [editingPage, setEditingPage] = useState<PageContent | null>(null);
    const [pageForm, setPageForm] = useState({ title: '', content: '', isActive: true });

    useEffect(() => {
        fetchSettings();
        fetchPages();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/home-settings`);
            if (!res.ok) return;
            const data = await res.json();
            setSettings(data);
            setPhone(data.phone || '');
            setAddress(data.address || '');
            const slides = typeof data.heroSlides === 'string' 
                ? JSON.parse(data.heroSlides) 
                : (data.heroSlides || []);
            setHeroSlides(Array.isArray(slides) ? slides : []);
        } catch (err) {
            console.error('Failed to fetch settings:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchPages = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/admin/pages`, {
                headers: { 'x-user-email': user?.email || '' }
            });
            if (!res.ok) return;
            const data = await res.json();
            setPages(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to fetch pages:', err);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const payload = {
                phone,
                address,
                heroSlides: typeof heroSlides === 'string' ? heroSlides : JSON.stringify(heroSlides)
            };
            
            const res = await fetch(`${API_BASE}/api/home-settings`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-email': user?.email || ''
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setMessage({ type: 'success', text: 'Settings saved successfully!' });
            } else {
                const data = await res.json();
                setMessage({ type: 'error', text: data.error || 'Failed to save settings' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to save settings' });
        } finally {
            setSaving(false);
        }
    };

    const handleSavePage = async () => {
        if (!editingPage) return;
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const res = await fetch(`${API_BASE}/api/pages/${editingPage.slug}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-email': user?.email || ''
                },
                body: JSON.stringify(pageForm)
            });

            if (res.ok) {
                setMessage({ type: 'success', text: 'Page saved successfully!' });
                fetchPages();
                setEditingPage(null);
            } else {
                const data = await res.json();
                setMessage({ type: 'error', text: data.error || 'Failed to save page' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to save page' });
        } finally {
            setSaving(false);
        }
    };

    const openPageEditor = (page: PageContent) => {
        setEditingPage(page);
        setPageForm({ title: page.title, content: page.content, isActive: page.isActive });
    };

    const addSlide = () => {
        const newId = Math.max(...heroSlides.map(s => s.id), 0) + 1;
        setHeroSlides([
            ...heroSlides,
            {
                id: newId,
                title: 'New Slide',
                subtitle: 'Add your subtitle here',
                badge: 'New',
                price: '৳0',
                cta: 'Shop Now',
                link: '/category/all',
                bg: 'from-secondary to-gray-800',
                accent: 'NEW',
                image: 'https://placehold.co/800x600/111/fff?text=New+Product'
            }
        ]);
    };

    const updateSlide = (id: number, field: keyof HeroSlide, value: string) => {
        setHeroSlides(heroSlides.map(slide => 
            slide.id === id ? { ...slide, [field]: value } : slide
        ));
    };

    const deleteSlide = (id: number) => {
        if (heroSlides.length <= 1) {
            alert('You must have at least one hero slide');
            return;
        }
        setHeroSlides(heroSlides.filter(slide => slide.id !== id));
    };

    if (loading) return <div className="p-10 text-center text-secondary font-bold">Loading...</div>;

    return (
        <div className="container mx-auto px-4 py-12">
            <h1 className="text-3xl font-bold text-secondary mb-8">Home Page Settings</h1>

            {message.text && (
                <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            <div className="flex gap-4 mb-6 border-b overflow-x-auto">
                <button
                    onClick={() => setActiveTab('company')}
                    className={`px-6 py-3 font-bold whitespace-nowrap ${activeTab === 'company' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
                >
                    Company Info
                </button>
                <button
                    onClick={() => setActiveTab('hero')}
                    className={`px-6 py-3 font-bold whitespace-nowrap ${activeTab === 'hero' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
                >
                    Hero Slides
                </button>
                <button
                    onClick={() => setActiveTab('pages')}
                    className={`px-6 py-3 font-bold whitespace-nowrap ${activeTab === 'pages' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
                >
                    CMS Pages
                </button>
                <button
                    onClick={() => setActiveTab('popup')}
                    className={`px-6 py-3 font-bold whitespace-nowrap ${activeTab === 'popup' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
                >
                    Popup Offers
                </button>
            </div>

            {activeTab === 'company' && (
                <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h2 className="text-xl font-bold mb-6">Company Information</h2>
                    <div className="grid gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number</label>
                            <input
                                type="text"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                                placeholder="+88 01234 567890"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Address</label>
                            <textarea
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                                rows={3}
                                placeholder="Dhaka, Bangladesh"
                            />
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'hero' && (
                <div className="bg-white rounded-2xl shadow-lg p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold">Hero Slides</h2>
                        <button
                            onClick={addSlide}
                            className="bg-primary text-black px-6 py-2 rounded-xl font-bold hover:bg-orange-600 transition-all"
                        >
                            + Add Slide
                        </button>
                    </div>

                    <div className="space-y-6">
                        {heroSlides.map((slide, index) => (
                            <div key={slide.id} className="border border-gray-200 rounded-xl p-4">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="font-bold text-gray-500">Slide {index + 1}</span>
                                    <button
                                        onClick={() => deleteSlide(slide.id)}
                                        className="text-red-500 hover:text-red-700 font-bold"
                                    >
                                        Delete
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Title</label>
                                        <input
                                            type="text"
                                            value={slide.title}
                                            onChange={(e) => updateSlide(slide.id, 'title', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Badge</label>
                                        <input
                                            type="text"
                                            value={slide.badge}
                                            onChange={(e) => updateSlide(slide.id, 'badge', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Subtitle</label>
                                        <input
                                            type="text"
                                            value={slide.subtitle}
                                            onChange={(e) => updateSlide(slide.id, 'subtitle', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Price</label>
                                        <input
                                            type="text"
                                            value={slide.price}
                                            onChange={(e) => updateSlide(slide.id, 'price', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">CTA Button Text</label>
                                        <input
                                            type="text"
                                            value={slide.cta}
                                            onChange={(e) => updateSlide(slide.id, 'cta', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Link</label>
                                        <input
                                            type="text"
                                            value={slide.link}
                                            onChange={(e) => updateSlide(slide.id, 'link', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                            placeholder="/category/smartphone"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Background Class</label>
                                        <input
                                            type="text"
                                            value={slide.bg}
                                            onChange={(e) => updateSlide(slide.id, 'bg', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                            placeholder="from-secondary to-gray-800"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Accent Text</label>
                                        <input
                                            type="text"
                                            value={slide.accent}
                                            onChange={(e) => updateSlide(slide.id, 'accent', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Image URL</label>
                                        <input
                                            type="text"
                                            value={slide.image}
                                            onChange={(e) => updateSlide(slide.id, 'image', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'pages' && (
                <div className="bg-white rounded-2xl shadow-lg p-6">
                    {editingPage ? (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold">Edit: {editingPage.title}</h2>
                                <button
                                    onClick={() => setEditingPage(null)}
                                    className="text-gray-500 hover:text-gray-700 font-bold"
                                >
                                    ← Back to list
                                </button>
                            </div>
                            <div className="grid gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Page Title</label>
                                    <input
                                        type="text"
                                        value={pageForm.title}
                                        onChange={(e) => setPageForm({ ...pageForm, title: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Content (HTML)</label>
                                    <textarea
                                        value={pageForm.content}
                                        onChange={(e) => setPageForm({ ...pageForm, content: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-sm"
                                        rows={15}
                                    />
                                    <p className="text-xs text-gray-500 mt-2">You can use HTML tags like &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;b&gt;, etc.</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="pageIsActive"
                                        checked={pageForm.isActive}
                                        onChange={(e) => setPageForm({ ...pageForm, isActive: e.target.checked })}
                                        className="w-5 h-5"
                                    />
                                    <label htmlFor="pageIsActive" className="text-sm font-bold text-gray-700">Active</label>
                                </div>
                                <div className="flex gap-4">
                                    <button
                                        onClick={handleSavePage}
                                        disabled={saving}
                                        className="bg-primary text-black px-8 py-3 rounded-xl font-bold hover:bg-orange-600 transition-all disabled:opacity-50"
                                    >
                                        {saving ? 'Saving...' : 'Save Page'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <h2 className="text-xl font-bold mb-6">CMS Pages</h2>
                            <div className="grid gap-4">
                                {cmsPages.map((pageInfo) => {
                                    const pageData = pages.find(p => p.slug === pageInfo.slug);
                                    return (
                                        <div key={pageInfo.slug} className="flex justify-between items-center p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                                            <div>
                                                <div className="font-bold text-secondary">{pageInfo.label}</div>
                                                <div className="text-xs text-gray-500">/{pageInfo.slug}</div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className={`px-3 py-1 rounded-lg text-[10px] font-bold ${pageData?.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                    {pageData?.isActive ? 'ACTIVE' : 'INACTIVE'}
                                                </span>
                                                <button
                                                    onClick={() => openPageEditor(pageData || { id: 0, slug: pageInfo.slug, title: pageInfo.label, content: '', isActive: true })}
                                                    className="bg-blue-600 text-black px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-600/30 transition-all"
                                                >
                                                    Edit
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'popup' && (
                <div className="bg-white rounded-2xl shadow-lg p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold">Popup Offers</h2>
                        <a
                            href="/admin/popup-offers"
                            className="bg-primary text-black px-6 py-2 rounded-xl font-bold hover:bg-orange-600 transition-all"
                        >
                            + Add New Popup
                        </a>
                    </div>
                    <p className="text-gray-500">Manage your popup offers here. Click "Add New Popup" to create a new popup offer.</p>
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">Go to <a href="/admin/popup-offers" className="text-primary font-bold hover:underline">Popup Offers Page</a> to manage all popup offers.</p>
                    </div>
                </div>
            )}

            {activeTab !== 'pages' && activeTab !== 'popup' && (
                <div className="mt-6">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-primary text-black px-8 py-3 rounded-xl font-bold hover:bg-orange-600 transition-all disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            )}
        </div>
    );
}
