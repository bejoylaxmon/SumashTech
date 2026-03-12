'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { Phone, MapPin, Search, ShoppingCart, LogOut, Settings, Eye, Package, Newspaper, Headphones, Building2, TrendingUp, LogIn, User } from 'lucide-react';

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
    const [headerLogo, setHeaderLogo] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const [categories, setCategories] = useState<any[]>([]);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/home-settings`);
                if (!res.ok) return;
                const data = await res.json();
                if (data.phone) setCompanyPhone(data.phone);
                if (data.address) setCompanyAddress(data.address);
                if (data.headerLogo) setHeaderLogo(data.headerLogo);
            } catch (err) {
                console.error('Failed to fetch header settings:', err);
            }
        };
        fetchSettings();

        const fetchCategories = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/categories`);
                if (!res.ok) return;
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

    // Clear search query when leaving search page
    useEffect(() => {
        if (!pathname.startsWith('/search')) {
            setSearchQuery('');
        }
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
                </div>
            </div>

            {/* Main Header */}
            <div className="container mx-auto px-4 py-5 flex items-center justify-between gap-8">
                {/* Logo */}
                <Link href="/" className="flex-shrink-0 relative group" style={{ minWidth: '120px', maxWidth: '200px' }}>
                    {headerLogo ? (
                        <img
                            src={headerLogo}
                            alt="Sumash Tech"
                            className="h-12 w-full max-w-[200px] object-contain"
                        />
                    ) : (
                        <Image
                            src="/logo.png"
                            alt="Sumash Tech"
                            width={280}
                            height={70}
                            className="h-12 w-auto object-contain"
                            priority
                        />
                    )}
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

                {/* Login/Logout & Cart Section */}
                <div className="flex items-center gap-4">
                    <Link href="/cart" className="relative text-gray-500 hover:text-primary transition-colors">
                        <ShoppingCart className="h-6 w-6" />
                        {cartCount > 0 && (
                            <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] bg-primary text-black text-[9px] font-black rounded-full flex items-center justify-center px-1">
                                {cartCount > 99 ? '99+' : cartCount}
                            </span>
                        )}
                    </Link>
                    {user ? (
                        <div className="relative" ref={menuRef}>
                            <button 
                                onClick={() => setUserMenuOpen(!userMenuOpen)}
                                className="text-xs font-black uppercase tracking-wider text-gray-500 hover:text-secondary flex items-center gap-2"
                            >
                                MY ACCOUNT
                            </button>
                            {userMenuOpen && (
                                <div className="absolute right-0 top-full bg-white shadow-xl border border-gray-100 py-2 min-w-[180px] z-50">
                                    {user.role === 'CUSTOMER' && (
                                        <Link href="/orders" className="block px-4 py-2 text-xs font-bold text-gray-600 hover:text-primary hover:bg-gray-50">
                                            My Orders
                                        </Link>
                                    )}
                                    <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-xs font-bold text-gray-600 hover:text-primary hover:bg-gray-50">
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link href="/login" className="p-2 rounded-lg hover:bg-gray-100 transition-all text-gray-500 hover:text-primary">
                            <LogIn className="h-6 w-6" />
                        </Link>
                    )}
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
                                    {(user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'MANAGER') && (
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
                                        <Link href="/admin/home-settings" className={navLinkClass('/admin/home-settings', 'text-pink-600')}>🏠 Home Settings</Link>
                                    )}
                                    {(user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'MANAGER') && (
                                        <Link href="/admin/chat" className={navLinkClass('/admin/chat', 'text-cyan-600')}>💬 Chat</Link>
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
