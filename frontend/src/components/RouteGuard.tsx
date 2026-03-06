'use client';

import { useAuth } from '@/context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function RouteGuard({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!loading) {
            const isAdminRoute = pathname.startsWith('/admin');
            const isAuthRoute = pathname === '/login' || pathname === '/signup';

            if (isAdminRoute) {
                if (!user) {
                    router.push('/login');
                } else if (user.role === 'CUSTOMER') {
                    router.push('/');
                }
            }
        }
    }, [user, loading, pathname, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Authenticating...</span>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
