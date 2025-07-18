"use client";
import { useState, useEffect } from "react";
import CartPanel from "./CartPanel";
import { useCart } from "../contexts/CartContext";

export default function CartButtonAndPanel() {
  const [cartOpen, setCartOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { getTotalItems } = useCart();
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const totalItems = mounted ? getTotalItems() : 0;

  return (
    <>
      <button
        className="relative flex items-center justify-center bg-transparent hover:scale-110 transition-transform"
        onClick={() => setCartOpen(true)}
        aria-label="Abrir carrito"
      >
        {/* Icono SVG carrito moderno */}
        <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="19" cy="19" r="19" fill="#171717"/>
          <path d="M11 12h1.5l1.7 11.2a2 2 0 0 0 2 1.8h7.6a2 2 0 0 0 2-1.7l1.2-7.5a1 1 0 0 0-1-1.2H13.2" stroke="#FFD600" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="16.5" cy="29" r="1.5" fill="#FFD600"/>
          <circle cx="25.5" cy="29" r="1.5" fill="#FFD600"/>
        </svg>
        {/* Contador de productos */}
        {mounted && totalItems > 0 && (
          <span className="absolute -top-2 -right-2 bg-yellow-400 text-black text-xs font-bold rounded-full px-2 py-0.5 border-2 border-black shadow-lg animate-bounce">
            {totalItems}
          </span>
        )}
      </button>
      <CartPanel open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
} 