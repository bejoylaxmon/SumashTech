'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';

import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';

export default function Header() {
    const { user, logout } = useAuth();
    const { cartCount } = useCart();
    const router = useRouter();
    const pathname = usePathname();
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

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

    const navLinkClass = (path: string, activeColor: string) => {
        const active = isActive(path);
        return `text-xs font-black h-14 flex items-center px-4 uppercase tracking-wider transition-all ${active
            ? `${activeColor} border-b-2 ${activeColor.replace('text-', 'border-')}`
            : 'text-gray-500 hover:text-secondary'
            }`;
    };

    const isAdmin = user && user.role !== 'CUSTOMER';

    return (
        <header className="w-full bg-white shadow-sm sticky top-0 z-50">
            {/* Top Bar */}
            <div className="bg-secondary text-white text-xs py-2 px-4 flex justify-between items-center hidden md:flex">
                <div>Welcome to Sumash Tech - Authentic Gadget Shop in BD</div>
                <div className="flex gap-4">
                    <span>Call: +880 1971-122222</span>
                    <Link href="/track-order">Track Order</Link>
                </div>
            </div>

            {/* Main Header */}
            <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
                {/* Logo */}
                <Link href="/" className="flex-shrink-0">
                    <Image
                        src="/logo.png"
                        alt="Sumash Tech"
                        width={280}
                        height={70}
                        className="h-14 w-auto object-contain"
                        priority
                    />
                </Link>

                {/* Search Bar */}
                <div className="flex-grow max-w-2xl relative">
                    <input
                        type="text"
                        placeholder="Search products..."
                        className="w-full border-2 border-primary rounded-full px-6 py-2 outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary text-white rounded-full p-2 h-9 w-9 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </button>
                </div>

                {/* Icons */}
                <div className="flex items-center gap-6 text-gray-700">
                    {user ? (
                        <div className="relative" ref={menuRef}>
                            <button
                                onClick={() => setUserMenuOpen(!userMenuOpen)}
                                className="flex items-center gap-3 cursor-pointer group"
                            >
                                <div className="flex flex-col items-end hidden sm:block">
                                    <span className="text-sm font-bold text-secondary block">{user.name}</span>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">{user.role === 'CUSTOMER' ? 'Customer' : 'Admin'}</span>
                                </div>
                                <div className="h-12 w-12 flex-shrink-0 rounded-full bg-gradient-to-br from-secondary to-gray-800 flex items-center justify-center border-2 border-gray-200 shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all">
                                    <span className="text-white font-black text-lg">{user.name.charAt(0).toUpperCase()}</span>
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
                                            <span className="text-base">🚪</span> Logout
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link href="/login" className="flex items-center gap-2 bg-secondary text-white px-8 py-4 rounded-2xl font-black hover:bg-black transition-all shadow-2xl shadow-secondary/40 border-2 border-white/20">
                            <span className="text-xs uppercase tracking-[0.2em] whitespace-nowrap">Login / Signup</span>
                        </Link>
                    )}
                    <Link href="/cart" className="flex flex-col items-center hover:text-primary transition-colors relative flex-shrink-0 group">
                        <div className="bg-secondary p-3 rounded-2xl group-hover:bg-primary transition-all border border-gray-700 shadow-md">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        {cartCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] rounded-full h-5 w-5 flex items-center justify-center font-black border-2 border-white shadow-lg animate-bounce-short">
                                {cartCount}
                            </span>
                        )}
                        <span className="text-[10px] font-black uppercase tracking-widest mt-1 text-gray-600 group-hover:text-primary hidden sm:block">Cart</span>
                    </Link>
                </div>
            </div>

            {/* Main Navigation - Dynamic based on role/permissions */}
            <nav className="bg-white border-b border-gray-100 pb-0.5 shadow-sm">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between h-14 overflow-x-auto no-scrollbar">
                        <div className="flex items-center gap-2 min-w-max h-full">
                            {(!user || user.role === 'CUSTOMER') ? (
                                <>
                                    <Link href="/" className={navLinkClass('/', 'text-primary')}>HOME</Link>
                                    <Link href="/category/smartphone-iphone" className={navLinkClass('/category/smartphone-iphone', 'text-secondary')}>IPHONE</Link>
                                    <Link href="/category/mac" className={navLinkClass('/category/mac', 'text-secondary')}>MAC</Link>
                                    <Link href="/category/ipad" className={navLinkClass('/category/ipad', 'text-secondary')}>IPAD</Link>
                                    <Link href="/category/watch" className={navLinkClass('/category/watch', 'text-secondary')}>WATCH</Link>
                                    <Link href="/category/gadgets" className={navLinkClass('/category/gadgets', 'text-secondary')}>GADGETS</Link>
                                    <Link href="/category/accessories" className={navLinkClass('/category/accessories', 'text-secondary')}>ACCESSORIES</Link>
                                    <Link href="/track-order" className={navLinkClass('/track-order', 'text-secondary')}>TRACK ORDER</Link>
                                </>
                            ) : (
                                <>
                                    <Link href="/" className="text-xs font-black text-gray-500 hover:text-secondary h-14 flex items-center px-4 uppercase tracking-widest transition-colors mr-6 border-r border-gray-100">STORE</Link>
                                    {(user.permissions?.includes('manage_products') || user.role === 'SUPER_ADMIN') && (
                                        <Link href="/admin/products" className={navLinkClass('/admin/products', 'text-blue-600')}>📦 Products</Link>
                                    )}
                                    {(user.permissions?.includes('manage_categories') || user.role === 'SUPER_ADMIN') && (
                                        <Link href="/admin/categories" className={navLinkClass('/admin/categories', 'text-indigo-600')}>📂 Categories</Link>
                                    )}
                                    {(user.permissions?.includes('view_orders') || user.role === 'SUPER_ADMIN') && (
                                        <Link href="/admin/orders" className={navLinkClass('/admin/orders', 'text-green-600')}>🧾 Orders</Link>
                                    )}
                                    {(user.permissions?.includes('manage_users') || user.role === 'SUPER_ADMIN') && (
                                        <Link href="/admin/users" className={navLinkClass('/admin/users', 'text-purple-600')}>👥 Users</Link>
                                    )}
                                    {(user.permissions?.includes('view_reports') || user.role === 'SUPER_ADMIN') && (
                                        <Link href="/admin/reports" className={navLinkClass('/admin/reports', 'text-orange-600')}>📊 Reports</Link>
                                    )}
                                </>
                            )}
                        </div>
                        {(!user || user.role === 'CUSTOMER') && (
                            <div className="flex items-center gap-4 min-w-max ml-8">
                                <span className="flex items-center gap-2 text-[10px] font-black text-white bg-green-600 px-5 py-2.5 rounded-full border-2 border-white/20 uppercase tracking-[0.2em] shadow-lg shadow-green-500/30">
                                    <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse"></span>
                                    Online Support
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </nav>
        </header>
    );
}
