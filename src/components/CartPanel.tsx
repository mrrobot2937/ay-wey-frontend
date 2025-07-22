"use client";
import { useCart, CartItem } from "../contexts/CartContext";
import { useState } from "react";
import Link from "next/link";

export default function CartPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { cart, removeFromCart, updateQuantity, clearCart, getTotalPrice } = useCart();
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);

  const subtotal = getTotalPrice();
  const total = subtotal - discount;

  function handleApplyCoupon() {
    if (coupon.toUpperCase() === "PRIMERA10" && !couponApplied) {
      setDiscount(Math.round(subtotal * 0.1));
      setCouponApplied(true);
    }
  }

  function handleGoToCheckout() {
    onClose();
  }

  // Generar clave única para cada item del carrito
  function getCartItemKey(item: CartItem) {
    return item.selectedVariant ? `${String(item.id)}-${item.selectedVariant.size}` : String(item.id);
  }

  // Obtener nombre del producto con variante
  function getDisplayName(item: CartItem) {
    if (item.selectedVariant) {
      return `${item.name} (${item.selectedVariant.size})`;
    }
    return item.name;
  }

  return (
    <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-white text-gray-900 shadow-2xl z-[100] transform transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-yellow-500">Tu carrito</h2>
          <button onClick={onClose} className="text-2xl font-bold text-yellow-500 hover:text-yellow-400"> 7</button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cart.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🛒</div>
              <p className="text-gray-400 text-lg">Tu carrito está vacío</p>
              <p className="text-gray-500 text-sm mt-2">Agrega algunos productos para comenzar</p>
            </div>
          ) : (
            cart.map((item) => {
              const itemKey = getCartItemKey(item);
              return (
                <div key={itemKey} className="flex items-center gap-4 bg-gray-100 rounded-xl p-4 shadow border border-gray-200">
                  <div className="flex-1">
                    <div className="font-bold text-lg text-gray-900">{getDisplayName(item)}</div>
                    {item.selectedVariant && (
                      <div className="text-xs text-yellow-500 font-medium">
                        {item.selectedVariant.size} • ${item.selectedVariant.price.toLocaleString()}
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateQuantity(String(itemKey), Number(item.quantity) - 1)}
                        className="w-6 h-6 rounded-full bg-gray-200 text-gray-900 flex items-center justify-center hover:bg-yellow-400 hover:text-black transition-colors"
                      >
                        -
                      </button>
                      <span className="text-sm text-gray-500 min-w-[40px] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(String(itemKey), Number(item.quantity) + 1)}
                        className="w-6 h-6 rounded-full bg-yellow-400 text-black flex items-center justify-center hover:bg-yellow-300 transition-colors"
                      >
                        +
                      </button>
                    </div>
                    <div className="text-yellow-500 font-bold mt-1">
                      ${(item.price * item.quantity).toLocaleString()}
                    </div>
                  </div>
                  <button 
                    onClick={() => removeFromCart(String(itemKey))} 
                    className="text-red-500 hover:text-red-400 text-xl font-bold p-1"
                  >
                    ×
                  </button>
                </div>
              );
            })
          )}
        </div>
        {cart.length > 0 && (
          <div className="p-6 border-t border-gray-200 space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Cupón de descuento"
                value={coupon}
                onChange={e => setCoupon(e.target.value)}
                className="flex-1 px-4 py-2 rounded-full bg-gray-100 text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                disabled={couponApplied}
              />
              <button
                onClick={handleApplyCoupon}
                className="px-4 py-2 rounded-full bg-yellow-400 text-black font-bold hover:bg-yellow-300 transition-colors disabled:opacity-50"
                disabled={couponApplied}
              >
                {couponApplied ? "Aplicado" : "Aplicar"}
              </button>
            </div>
            <div className="flex justify-between text-lg">
              <span>Subtotal</span>
              <span>${subtotal.toLocaleString()}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-lg text-green-500">
                <span>Descuento (10%)</span>
                <span>- ${discount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-2xl font-extrabold border-t border-gray-300 pt-2">
              <span>Total</span>
              <span className="text-yellow-500">${total.toLocaleString()}</span>
            </div>
            <Link href="/checkout">
              <button
                className="w-full mt-4 py-3 rounded-full bg-yellow-400 text-black font-bold text-xl hover:bg-yellow-300 transition-colors"
                onClick={handleGoToCheckout}
              >
                Enviar ({cart.length} producto{cart.length !== 1 ? 's' : ''})
              </button>
            </Link>
            <button 
              onClick={clearCart} 
              className="w-full mt-2 py-2 rounded-full bg-gray-100 text-red-500 font-bold hover:bg-gray-200 transition-colors"
            >
              Vaciar carrito
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 