'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface CartItem {
    id: number;
    productId: number;
    name: string;
    slug: string;
    price: number;
    quantity: number;
    image: string;
    stock: number;
}

interface CartContextType {
    cart: CartItem[];
    addToCart: (product: any, quantity?: number) => void;
    removeFromCart: (productId: number) => void;
    updateQuantity: (productId: number, quantity: number) => void;
    clearCart: () => void;
    cartCount: number;
    cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [cart, setCart] = useState<CartItem[]>([]);

    // Load cart from localStorage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            try {
                setCart(JSON.parse(savedCart));
            } catch (e) {
                console.error('Failed to parse cart:', e);
                localStorage.removeItem('cart');
            }
        }
    }, []);

    // Save cart to localStorage on change
    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cart));
    }, [cart]);

    const addToCart = (product: any, quantity = 1) => {
        const stock = product.stock ?? 999;
        if (stock <= 0) return; // Can't add out-of-stock products

        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.productId === product.id);
            if (existingItem) {
                const newQty = Math.min(existingItem.quantity + quantity, stock);
                return prevCart.map(item =>
                    item.productId === product.id
                        ? { ...item, quantity: newQty, stock }
                        : item
                );
            }
            const cappedQty = Math.min(quantity, stock);
            return [...prevCart, {
                id: Date.now(),
                productId: product.id,
                name: product.name,
                slug: product.slug,
                price: product.price,
                quantity: cappedQty,
                image: product.images && product.images.length > 0 ? product.images[0] : '/placeholder.png',
                stock
            }];
        });
    };

    const removeFromCart = (productId: number) => {
        setCart(prevCart => prevCart.filter(item => item.productId !== productId));
    };

    const updateQuantity = (productId: number, quantity: number) => {
        if (quantity < 1) return;
        setCart(prevCart =>
            prevCart.map(item => {
                if (item.productId === productId) {
                    const cappedQty = Math.min(quantity, item.stock);
                    return { ...item, quantity: cappedQty };
                }
                return item;
            })
        );
    };

    const clearCart = () => {
        setCart([]);
    };

    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
    const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, cartCount, cartTotal }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
