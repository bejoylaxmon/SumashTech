'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:54321';

interface ProactiveEvent {
    id: number;
    userId: number;
    eventType: string;
    orderId: number | null;
    payload: Record<string, unknown>;
    status: string;
    createdAt: string;
}

interface EventConfig {
    icon: string;
    title: string;
    message: string;
    color: string;
    gradient: string;
    actions: ActionConfig[];
}

interface ActionConfig {
    label: string;
    icon: string;
    action: (event: ProactiveEvent, router: ReturnType<typeof useRouter>, openChat: () => void) => void;
    style: 'primary' | 'secondary' | 'ghost';
}

const EVENT_CONFIG: Record<string, EventConfig> = {
    order_created: {
        icon: '🎉',
        title: 'Order Placed!',
        message: 'Your order has been placed successfully.',
        color: '#10b981',
        gradient: 'from-emerald-500 to-teal-600',
        actions: [
            {
                label: 'Track Order',
                icon: '📦',
                action: (ev, router) => router.push(`/track-order?id=${ev.orderId}`),
                style: 'primary',
            },
            {
                label: 'View Orders',
                icon: '🗂️',
                action: (_, router) => router.push('/orders'),
                style: 'secondary',
            },
        ],
    },
    order_delayed: {
        icon: '⏰',
        title: 'Order Delayed',
        message: 'Your order seems to be delayed. We apologise for the inconvenience.',
        color: '#f59e0b',
        gradient: 'from-amber-500 to-orange-500',
        actions: [
            {
                label: 'Track Shipment',
                icon: '🚚',
                action: (ev, router) => router.push(`/track-order?id=${ev.orderId}`),
                style: 'primary',
            },
            {
                label: 'Contact Courier',
                icon: '📞',
                action: (_, __, openChat) => openChat(),
                style: 'secondary',
            },
            {
                label: 'Request Compensation',
                icon: '💰',
                action: (_, __, openChat) => openChat(),
                style: 'ghost',
            },
        ],
    },
    payment_failed: {
        icon: '❌',
        title: 'Payment Failed',
        message: "Your payment didn't complete. Please retry or use a different method.",
        color: '#ef4444',
        gradient: 'from-red-500 to-rose-600',
        actions: [
            {
                label: 'Retry Payment',
                icon: '🔄',
                action: (ev, router) => router.push(ev.orderId ? `/checkout?retry=${ev.orderId}` : '/cart'),
                style: 'primary',
            },
            {
                label: 'Change Method',
                icon: '💳',
                action: (_, __, openChat) => openChat(),
                style: 'secondary',
            },
        ],
    },
    cart_abandoned: {
        icon: '🛒',
        title: 'Still Shopping?',
        message: 'You left some items in your cart. Need help completing your order?',
        color: '#6366f1',
        gradient: 'from-indigo-500 to-purple-600',
        actions: [
            {
                label: 'Checkout Now',
                icon: '⚡',
                action: (_, router) => router.push('/checkout'),
                style: 'primary',
            },
            {
                label: 'Apply Discount',
                icon: '🎁',
                action: (_, __, openChat) => openChat(),
                style: 'secondary',
            },
        ],
    },
    order_delivered: {
        icon: '📬',
        title: 'Order Delivered!',
        message: 'Your order was delivered today. How can we help you next?',
        color: '#3b82f6',
        gradient: 'from-blue-500 to-cyan-600',
        actions: [
            {
                label: 'Leave Review',
                icon: '⭐',
                action: (_, router) => router.push('/orders'),
                style: 'primary',
            },
            {
                label: 'Return Item',
                icon: '↩️',
                action: (_, __, openChat) => openChat(),
                style: 'secondary',
            },
            {
                label: 'Warranty',
                icon: '🛡️',
                action: (_, __, openChat) => openChat(),
                style: 'ghost',
            },
        ],
    },
    return_window_closing: {
        icon: '⚠️',
        title: 'Return Window Closing',
        message: 'Your return window is closing soon. Initiate a return if needed.',
        color: '#f97316',
        gradient: 'from-orange-500 to-red-500',
        actions: [
            {
                label: 'Start Return',
                icon: '↩️',
                action: (_, __, openChat) => openChat(),
                style: 'primary',
            },
            {
                label: 'Learn More',
                icon: '📋',
                action: (_, router) => router.push('/return-policy'),
                style: 'secondary',
            },
        ],
    },
};

// Small badge showing number of pending events on the chat button
export function ProactiveEventBadge({ count }: { count: number }) {
    if (count === 0) return null;
    return (
        <span
            style={{
                position: 'absolute',
                top: '-6px',
                right: '-6px',
                background: '#ef4444',
                color: '#fff',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 700,
                border: '2px solid #fff',
                zIndex: 60,
            }}
        >
            {count > 9 ? '9+' : count}
        </span>
    );
}

export default function ProactiveChatBubble({
    onOpenChat,
}: {
    onOpenChat?: () => void;
}) {
    const { user } = useAuth();
    const router = useRouter();
    const [events, setEvents] = useState<ProactiveEvent[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [visible, setVisible] = useState(false);
    const [animatingOut, setAnimatingOut] = useState(false);

    const isCustomer = user?.role === 'CUSTOMER';

    const fetchPending = useCallback(async () => {
        if (!user || !isCustomer) return;
        try {
            const res = await fetch(`${API_URL}/api/events/pending/${user.id}`);
            if (res.ok) {
                const data: ProactiveEvent[] = await res.json();
                if (data.length > 0) {
                    setEvents(data);
                    setCurrentIndex(0);
                    setVisible(true);
                    setAnimatingOut(false);
                }
            }
        } catch { /* silent */ }
    }, [user, isCustomer]);

    // Poll every 10 seconds
    useEffect(() => {
        if (!isCustomer) return;
        fetchPending();
        const interval = setInterval(fetchPending, 10000);
        return () => clearInterval(interval);
    }, [fetchPending, isCustomer]);

    const currentEvent = events[currentIndex];
    const config = currentEvent ? EVENT_CONFIG[currentEvent.eventType] : null;

    const dismiss = async (status: 'dismissed' | 'delivered' = 'dismissed') => {
        if (!currentEvent) return;
        setAnimatingOut(true);
        setTimeout(async () => {
            await fetch(`${API_URL}/api/events/${currentEvent.id}/dismiss`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            }).catch(() => { });

            const next = events.filter((e) => e.id !== currentEvent.id);
            setEvents(next);
            if (next.length === 0) {
                setVisible(false);
            } else {
                setCurrentIndex(0);
                setAnimatingOut(false);
            }
        }, 300);
    };

    const handleAction = (action: ActionConfig['action']) => {
        dismiss('delivered');
        const openChat = onOpenChat || (() => { });
        action(currentEvent!, router, openChat);
    };

    if (!visible || !currentEvent || !config) return null;

    return (
        <>
            <style>{`
        @keyframes proactive-slide-in {
          from { transform: translateY(40px) scale(0.95); opacity: 0; }
          to   { transform: translateY(0)    scale(1);    opacity: 1; }
        }
        @keyframes proactive-slide-out {
          from { transform: translateY(0)    scale(1);    opacity: 1; }
          to   { transform: translateY(40px) scale(0.95); opacity: 0; }
        }
        @keyframes proactive-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(99,102,241,0.4); }
          50%       { box-shadow: 0 0 0 8px rgba(99,102,241,0); }
        }
        .proactive-bubble {
          animation: proactive-slide-in 0.35s cubic-bezier(.34,1.56,.64,1) both;
        }
        .proactive-bubble-out {
          animation: proactive-slide-out 0.3s ease forwards;
        }
        .proactive-btn-primary {
          background: linear-gradient(135deg, var(--ev-color1), var(--ev-color2));
          color: #fff;
          border: none;
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .proactive-btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.25);
        }
        .proactive-btn-secondary {
          background: rgba(255,255,255,0.12);
          color: #fff;
          border: 1px solid rgba(255,255,255,0.3);
          transition: background 0.15s;
        }
        .proactive-btn-secondary:hover { background: rgba(255,255,255,0.2); }
        .proactive-btn-ghost {
          background: transparent;
          color: rgba(255,255,255,0.8);
          border: none;
          text-decoration: underline;
          font-size: 12px;
          transition: color 0.15s;
        }
        .proactive-btn-ghost:hover { color: #fff; }
      `}</style>

            <div
                className={`proactive-bubble${animatingOut ? ' proactive-bubble-out' : ''}`}
                style={{
                    position: 'fixed',
                    bottom: '110px',
                    right: '24px',
                    width: '320px',
                    zIndex: 60,
                    borderRadius: '20px',
                    overflow: 'hidden',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.25), 0 4px 16px rgba(0,0,0,0.12)',
                    fontFamily: 'Inter, system-ui, sans-serif',
                }}
            >
                {/* Header gradient */}
                <div
                    style={{
                        background: `linear-gradient(135deg, #1e293b 0%, ${config.color}33 100%)`,
                        borderBottom: `1px solid ${config.color}40`,
                        padding: '16px 16px 12px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        position: 'relative',
                    }}
                >
                    {/* Animated icon blob */}
                    <div
                        style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '12px',
                            background: `linear-gradient(135deg, ${config.color}, ${config.color}88)`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '22px',
                            flexShrink: 0,
                            boxShadow: `0 4px 12px ${config.color}44`,
                        }}
                    >
                        {config.icon}
                    </div>

                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                            <span
                                style={{
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.08em',
                                    color: config.color,
                                }}
                            >
                                Support Alert
                            </span>
                            {events.length > 1 && (
                                <span
                                    style={{
                                        fontSize: '10px',
                                        background: config.color + '33',
                                        color: config.color,
                                        borderRadius: '10px',
                                        padding: '1px 7px',
                                        fontWeight: 600,
                                    }}
                                >
                                    {currentIndex + 1}/{events.length}
                                </span>
                            )}
                        </div>
                        <p
                            style={{
                                margin: 0,
                                fontWeight: 700,
                                fontSize: '15px',
                                color: '#f1f5f9',
                                lineHeight: 1.3,
                            }}
                        >
                            {config.title}
                        </p>
                    </div>

                    {/* Close button */}
                    <button
                        onClick={() => dismiss('dismissed')}
                        style={{
                            background: 'rgba(255,255,255,0.1)',
                            border: 'none',
                            borderRadius: '8px',
                            width: '28px',
                            height: '28px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#94a3b8',
                            fontSize: '16px',
                            flexShrink: 0,
                            transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                    >
                        ×
                    </button>
                </div>

                {/* Body */}
                <div
                    style={{
                        background: '#0f172a',
                        padding: '14px 16px 16px',
                    }}
                >
                    <p
                        style={{
                            margin: '0 0 14px',
                            fontSize: '13px',
                            color: '#94a3b8',
                            lineHeight: 1.5,
                        }}
                    >
                        {(currentEvent.payload as { message?: string })?.message || config.message}
                    </p>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {config.actions.map((action, i) => (
                            <button
                                key={i}
                                onClick={() => handleAction(action.action)}
                                className={`proactive-btn-${action.style}`}
                                style={{
                                    padding: '9px 14px',
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    fontSize: '13px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '7px',
                                    justifyContent: 'center',
                                    width: '100%',
                                    ...(action.style === 'primary'
                                        ? {
                                            background: `linear-gradient(135deg, ${config.color}, ${config.color}cc)`,
                                            color: '#fff',
                                            border: 'none',
                                            boxShadow: `0 4px 12px ${config.color}44`,
                                        }
                                        : {}),
                                }}
                            >
                                <span>{action.icon}</span>
                                {action.label}
                            </button>
                        ))}
                    </div>

                    {/* Multiple events: skip to next */}
                    {events.length > 1 && (
                        <button
                            onClick={() => {
                                const next = (currentIndex + 1) % events.length;
                                setCurrentIndex(next);
                            }}
                            style={{
                                marginTop: '10px',
                                width: '100%',
                                background: 'transparent',
                                border: 'none',
                                color: '#475569',
                                fontSize: '12px',
                                cursor: 'pointer',
                                textDecoration: 'underline',
                                padding: '4px',
                            }}
                        >
                            See next notification →
                        </button>
                    )}
                </div>

                {/* Bottom accent bar */}
                <div
                    style={{
                        height: '3px',
                        background: `linear-gradient(90deg, ${config.color}, ${config.color}44)`,
                    }}
                />
            </div>
        </>
    );
}
