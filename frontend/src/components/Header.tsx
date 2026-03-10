'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { Facebook, Instagram, Youtube, Phone, MapPin, Package, Search, ShoppingCart, LogOut, Settings, Eye } from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { API_BASE } from '@/lib/api';

export default function Header() {
    const { user, logout } = useAuth();
    const { cartCount } = useCart();
    const router = useRouter();
    const pathname = usePathname();
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [companyPhone, setCompanyPhone] = useState('+880 1971-122222');
    const [companyAddress, setCompanyAddress] = useState('Shop Locations');
    const menuRef = useRef<HTMLDivElement>(null);
    const [categories, setCategories] = useState<any[]>([]);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/home-settings`);
                const data = await res.json();
                if (data.phone) setCompanyPhone(data.phone);
                if (data.address) setCompanyAddress(data.address);
            } catch (err) {
                console.error('Failed to fetch header settings:', err);
            }
        };
        fetchSettings();

        const fetchCategories = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/categories`);
                const data = await res.json();
                setCategories(data);
            } catch (err) {
                console.error('Failed to fetch categories:', err);
            }
        };
        fetchCategories();
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Close menu on route change
    useEffect(() => {
        setUserMenuOpen(false);
    }, [pathname]);

    const handleLogout = () => {
        setUserMenuOpen(false);
        logout();
        router.push('/');
        router.refresh();
    };

    const isActive = (path: string) => {
        if (path === '/' && pathname === '/') return true;
        if (path !== '/' && pathname.startsWith(path)) return true;
        return false;
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    const navLinkClass = (path: string, activeColor: string) => {
        const active = isActive(path);
        return `text-xs font-black h-14 flex items-center px-4 uppercase tracking-wider transition-all ${active
            ? `${activeColor} border-b-2 ${activeColor.replace('text-', 'border-')}`
            : 'text-gray-500 hover:text-secondary'
            }`;
    };

    const isAdmin = user && user.role !== 'CUSTOMER';

    return (
        <header className="w-full bg-white shadow-sm sticky top-0 z-50 font-sans">
            {/* Top Bar */}
            <div className="bg-secondary text-black text-[10px] py-2 px-4 hidden md:flex border-b border-white/5">
                <div className="container mx-auto flex justify-between items-center font-black uppercase tracking-[0.15em]">
                    <div className="flex gap-6 items-center">
                        <span className="flex items-center gap-2 hover:text-primary transition-colors cursor-pointer">
                            <Phone className="w-3.5 h-3.5" /> {companyPhone}
                        </span>
                        <span className="flex items-center gap-2 hover:text-primary transition-colors cursor-pointer">
                            <MapPin className="w-3.5 h-3.5" /> {companyAddress}
                        </span>
                    </div>
<div className="flex gap-6 items-center">
                        <Link href="/track-order" className="hover:text-primary transition-colors flex items-center gap-2">
                            <Package className="w-3.5 h-3.5" /> Track Your Order
                        </Link>
                        <span className="w-px h-3 bg-black/20"></span>
                        <div className="flex gap-3">
                            <a href="#" className="hover:scale-110 transition-transform hover:text-primary">
                                <Facebook className="w-3.5 h-3.5" />
                            </a>
                            <a href="#" className="hover:scale-110 transition-transform hover:text-primary">
                                <Instagram className="w-3.5 h-3.5" />
                            </a>
                            <a href="#" className="hover:scale-110 transition-transform hover:text-primary">
                                <Youtube className="w-3.5 h-3.5" />
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Header */}
            <div className="container mx-auto px-4 py-5 flex items-center justify-between gap-8">
                {/* Logo */}
                <Link href="/" className="flex-shrink-0 relative group">
                    <Image
                        src="/logo.png"
                        alt="Sumash Tech"
                        width={280}
                        height={70}
                        className="h-12 w-auto object-contain"
                        priority
                    />
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
                </Link>

                {/* Search Bar - Refined */}
                <form onSubmit={handleSearch} className="flex-grow max-w-2xl relative group">
<div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                        <Search className="h-5 w-5" />
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search for iPhone, MacBook, or Gadgets..."
                        className="w-full bg-gray-50 border-2 border-transparent focus:border-primary/30 focus:bg-white rounded-2xl pl-14 pr-24 py-3.5 outline-none transition-all shadow-sm group-hover:shadow-md text-sm font-bold text-secondary"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-3">
                        <button type="submit" className="bg-primary text-black rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all shadow-lg shadow-primary/20">
                            Search
                        </button>
                    </div>
                </form>

                {/* Icons */}
                <div className="flex items-center gap-4">
                    {/* Login / Signup Button - Always Visible */}
                    {!user && (
                        <Link href="/login" className="flex items-center gap-2 bg-secondary text-black px-4 py-2 rounded-xl font-black hover:bg-black hover:text-white transition-all shadow-sm border border-white/20">
                            <span className="text-[10px] uppercase tracking-[0.15em] whitespace-nowrap">Login / Signup</span>
                        </Link>
                    )}

                    {/* User Menu - When Logged In */}
                    {user && (
                        <div className="relative" ref={menuRef}>
                            <button
                                onClick={() => setUserMenuOpen(!userMenuOpen)}
                                className="flex items-center gap-3 cursor-pointer group"
                            >
                                <div className="flex flex-col items-end hidden sm:block">
                                    <span className="text-sm font-bold text-secondary block">{user.name}</span>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">{user.role === 'CUSTOMER' ? 'Customer' : 'Admin'}</span>
                                </div>
                                <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gradient-to-br from-secondary to-gray-800 flex items-center justify-center border-2 border-gray-200 shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all">
                                    <span className="text-white font-black text-sm">{user.name.charAt(0).toUpperCase()}</span>
                                </div>
                                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {/* Dropdown Menu */}
                            {userMenuOpen && (
                                <div className="absolute right-0 top-full mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                                    {/* User Info Header */}
                                    <div className="px-5 py-4 bg-gray-50 border-b border-gray-100">
                                        <p className="font-black text-secondary text-sm">{user.name}</p>
                                        <p className="text-gray-400 text-xs mt-0.5">{user.email}</p>
                                    </div>

                                    <div className="py-2">
                                        {user.role === 'CUSTOMER' && (
                                            <Link href="/orders" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors text-sm font-bold text-gray-700">
                                                <span className="text-base">📦</span> My Orders
                                            </Link>
                                        )}
                                        <Link href="/track-order" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors text-sm font-bold text-gray-700">
                                            <span className="text-base">🔍</span> Track Order
                                        </Link>
                                        <Link href="/cart" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors text-sm font-bold text-gray-700">
                                            <span className="text-base">🛒</span> My Cart
                                        </Link>
                                        {isAdmin && (
                                            <>
                                                <div className="border-t border-gray-100 my-1"></div>
                                                <Link href="/admin/products" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors text-sm font-bold text-gray-700">
                                                    <span className="text-base">⚙️</span> Admin Dashboard
                                                </Link>
                                            </>
                                        )}
                                    </div>

                                    <div className="border-t border-gray-100">
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-3 px-5 py-3 hover:bg-red-50 transition-colors text-sm font-bold text-red-500"
                                        >
                                            <LogOut className="w-4 h-4" /> Logout
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Cart Icon - Always Visible */}
                    <Link href="/cart" className="flex flex-col items-center hover:text-primary transition-colors relative flex-shrink-0 group">
                        <div className="bg-secondary p-1.5 rounded-lg group-hover:bg-primary transition-all shadow-sm">
                            <ShoppingCart className="h-4 w-4 text-black group-hover:text-white transition-colors" />
                        </div>
                        {cartCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-primary text-black text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-black border-2 border-white shadow-lg animate-bounce-short">
                                {cartCount}
                            </span>
                        )}
                        <span className="text-[10px] font-black uppercase tracking-widest mt-1 text-gray-600 group-hover:text-primary hidden sm:block">Cart</span>
                    </Link>
                </div>
            </div>

            {/* Main Navigation - Dynamic based on role/permissions */}
            <nav className="bg-white border-b border-gray-100 shadow-sm relative h-14">
                <div className="container mx-auto px-4 h-full">
                    <div className="flex items-center justify-between h-full">
                        <div className="flex items-center gap-2 h-full">
                            {(!user || user.role === 'CUSTOMER') ? (
                                <>
                                    <Link href="/" className={navLinkClass('/', 'text-primary')}>HOME</Link>

                                    {/* Dynamic Category Menu Items */}
                                    {categories.filter((cat: any) => !cat.parentId).map((category: any) => (
                                        category.children && category.children.length > 0 ? (
                                            <div key={category.id} className="group h-full">
                                                <button className="text-xs font-black h-full flex items-center px-4 uppercase tracking-wider text-gray-500 group-hover:text-secondary group-hover:border-b-2 group-hover:border-secondary transition-all">
                                                    {category.name} <span className="ml-1 text-[8px]">▼</span>
                                                </button>
                                                <div className="absolute left-0 top-full w-full bg-white/95 backdrop-blur-xl shadow-2xl border-t border-gray-100 py-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                                                    <div className="container mx-auto px-4">
                                                        <div className="grid grid-cols-4 gap-8">
                                                            <div className="space-y-4 col-span-1">
                                                                <h4 className="font-black text-secondary text-sm uppercase tracking-widest border-b border-gray-100 pb-2">{category.name}</h4>
                                                                <ul className="space-y-2 text-xs font-bold text-gray-500">
                                                                    {category.children.map((child: any) => (
                                                                        <li key={child.id} className="hover:text-primary transition-colors">
                                                                            <Link href={`/category/${child.slug}`}>{child.name}</Link>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <Link 
                                                key={category.id} 
                                                href={`/category/${category.slug}`}
                                                className={navLinkClass(`/category/${category.slug}`, 'text-secondary')}
                                            >
                                                {category.name.toUpperCase()}
                                            </Link>
                                        )
                                    ))}
                                </>
                            ) : (
                                <>
                                    <Link href="/" className="text-xs font-black text-gray-500 hover:text-secondary h-14 flex items-center px-4 uppercase tracking-widest transition-colors mr-6 border-r border-gray-100">STORE</Link>
                                    {(user.permissions?.includes('view_product_detail') || user.role === 'SUPER_ADMIN') && (
                                        <Link href="/admin/products" className={navLinkClass('/admin/products', 'text-blue-600')}>📦 Products</Link>
                                    )}
                                    {(user.permissions?.includes('manage_inventory') || user.permissions?.includes('manage_coupons') || user.role === 'SUPER_ADMIN') && (
                                        <Link href="/admin/categories" className={navLinkClass('/admin/categories', 'text-indigo-600')}>📂 Categories</Link>
                                    )}
                                    {(user.permissions?.includes('view_orders_all') || user.role === 'SUPER_ADMIN') && (
                                        <Link href="/admin/orders" className={navLinkClass('/admin/orders', 'text-green-600')}>🧾 Orders</Link>
                                    )}
                                    {(user.permissions?.includes('create_orders_manual') || user.role === 'SUPER_ADMIN') && (
                                        <Link href="/admin/orders/create" className={navLinkClass('/admin/orders/create', 'text-orange-600')}>➕ Create Order</Link>
                                    )}
                                    {(user.permissions?.includes('manage_users') || user.role === 'SUPER_ADMIN') && (
                                        <Link href="/admin/users" className={navLinkClass('/admin/users', 'text-purple-600')}>👥 Users</Link>
                                    )}
                                    {(user.permissions?.includes('view_financial_reports') || user.role === 'SUPER_ADMIN') && (
                                        <Link href="/admin/reports" className={navLinkClass('/admin/reports', 'text-teal-600')}>📊 Reports</Link>
                                    )}
                                    {(user.role === 'SUPER_ADMIN' || user.role === 'MANAGER') && (
                                        <>
                                            <Link href="/admin/home-settings" className={navLinkClass('/admin/home-settings', 'text-pink-600')}>🏠 Home Settings</Link>
                                            <Link href="/admin/popup-offers" className={navLinkClass('/admin/popup-offers', 'text-red-600')}>🎯 Popup Offers</Link>
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </nav>
        </header>
    );
}
