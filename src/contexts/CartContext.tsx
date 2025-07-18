"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

// Tipo de producto para el carrito (compatible con ambos servicios)
export type Product = {
  id: string | number;
  name: string;
  price: number;
  description: string;
  image_url?: string;
  available?: boolean;
  is_available?: boolean;
  preparation_time?: number;
  category?: string | {
    id: string;
    name: string;
  };
  variants?: Array<{
    size: string;
    price: number;
    imageUrl?: string;
  }>;
  originalId?: string; // Para GraphQL compatibility
};

export type CartItem = Product & { 
  quantity: number;
  selectedVariant?: {
    size: string;
    price: number;
  };
};

type CartContextType = {
  cart: CartItem[];
  restaurantId: string;
  setRestaurantId: (id: string) => void;
  addToCart: (product: Product, variant?: { size: string; price: number }) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart debe usarse dentro de CartProvider");
  return context;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [restaurantId, setRestaurantId] = useState<string>("ay-wey");

  function addToCart(product: Product, variant?: { size: string; price: number }) {
    setCart((prev) => {
      const cartKey = variant ? `${product.id}-${variant.size}` : String(product.id);
      const found = prev.find((item) => {
        const itemKey = item.selectedVariant ? `${item.id}-${item.selectedVariant.size}` : String(item.id);
        return itemKey === cartKey;
      });
      
      if (found) {
        return prev.map((item) => {
          const itemKey = item.selectedVariant ? `${item.id}-${item.selectedVariant.size}` : String(item.id);
          return itemKey === cartKey ? { ...item, quantity: item.quantity + 1 } : item;
        });
      }
      
      const newItem: CartItem = {
        ...product,
        quantity: 1,
        selectedVariant: variant,
        price: variant ? variant.price : product.price,
        // Normalizar propiedades de disponibilidad
        available: product.available ?? product.is_available,
        is_available: product.available ?? product.is_available
      };
      
      return [...prev, newItem];
    });
  }

  function removeFromCart(productId: string) {
    setCart((prev) => prev.filter((item) => {
      const itemKey = item.selectedVariant ? `${item.id}-${item.selectedVariant.size}` : String(item.id);
      return itemKey !== productId;
    }));
  }

  function updateQuantity(productId: string, quantity: number) {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCart((prev) => prev.map((item) => {
      const itemKey = item.selectedVariant ? `${item.id}-${item.selectedVariant.size}` : String(item.id);
      return itemKey === productId ? { ...item, quantity } : item;
    }));
  }

  function clearCart() {
    setCart([]);
  }

  function getTotalPrice(): number {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  function getTotalItems(): number {
    return cart.reduce((total, item) => total + item.quantity, 0);
  }

  return (
    <CartContext.Provider value={{ 
      cart, 
      restaurantId,
      setRestaurantId,
      addToCart, 
      removeFromCart,
      updateQuantity,
      clearCart,
      getTotalPrice,
      getTotalItems
    }}>
      {children}
    </CartContext.Provider>
  );
} 