'use client';

import { useAuth } from '@/context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const ADMIN_ROLES = ['SUPER_ADMIN', 'MANAGER', 'ADMIN', 'SALES', 'EDITOR'];

export default function RouteGuard({ children }: { children: React.ReactNode }) {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const redirected = useRef(false);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (!isClient || authLoading || redirected.current) return;

        const isAdminRoute = pathname.startsWith('/admin');
        
        if (isAdminRoute) {
            if (!user) {
                redirected.current = true;
                router.replace('/login');
            } else if (!ADMIN_ROLES.includes(user.role)) {
                redirected.current = true;
                router.replace('/');
            }
        }
    }, [user, authLoading, pathname, router, isClient]);

    const isAdminRoute = pathname.startsWith('/admin');
    
    if (!isClient) {
        return null;
    }

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
            </div>
        );
    }

    if (isAdminRoute && (!user || !ADMIN_ROLES.includes(user.role))) {
        return null;
    }

    return <>{children}</>;
}
