"use client";

import { useCart } from "../contexts/CartContext";
import Image from "next/image";

type Product = {
  id: number;
  name: string;
  price: number;
  description: string;
  imageUrl?: string;
};

export default function ProductList({ products }: { products: Product[] }) {
  const { cart, addToCart, removeFromCart } = useCart();

  function getQuantity(productId: number) {
    return cart.find((item) => item.id === productId)?.quantity || 0;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => {
        const quantity = getQuantity(product.id);
        return (
          <div key={product.id} className="bg-white rounded-3xl p-4 shadow-2xl flex flex-col gap-3 border border-gray-200 hover:border-yellow-400 transition-colors relative overflow-hidden group h-full">
            {/* Imagen del producto - Mejorada para imágenes cuadradas */}
            <div className="relative aspect-square w-full bg-gray-100 rounded-2xl overflow-hidden mb-3">
              {product.imageUrl ? (
                <Image 
                  src={product.imageUrl} 
                  alt={product.name} 
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-300" 
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                  <div className="text-4xl mb-2">🍽️</div>
                  <span className="text-sm font-medium">Sin imagen</span>
                </div>
              )}
            </div>
            <div className="flex-1 flex flex-col">
              <h3 className="text-xl font-bold mb-2 line-clamp-2 leading-tight text-gray-900">{product.name}</h3>
              <p className="text-gray-500 mb-3 text-sm line-clamp-3 leading-relaxed">{product.description}</p>
              <span className="text-yellow-500 font-extrabold text-lg mb-3">${product.price.toLocaleString()}</span>
              {/* Controles de cantidad */}
              <div className="flex items-center gap-3 mb-3">
                <button
                  className="w-8 h-8 rounded-full bg-gray-100 text-yellow-500 border-2 border-yellow-400 font-bold text-xl flex items-center justify-center hover:bg-yellow-400 hover:text-black transition-colors"
                  onClick={() => removeFromCart(String(product.id))}
                  disabled={quantity === 0}
                  aria-label="Restar"
                >
                  -
                </button>
                <span className="text-lg font-bold w-6 text-center text-gray-900">{quantity}</span>
                <button
                  className="w-8 h-8 rounded-full bg-yellow-400 text-black font-bold text-xl flex items-center justify-center hover:bg-yellow-300 transition-colors"
                  onClick={() => addToCart(product)}
                  aria-label="Sumar"
                >
                  +
                </button>
              </div>
              {/* Espacio para cupones aplicados (placeholder) */}
              <div className="mb-3 min-h-[24px] text-green-500 font-bold text-sm"></div>
              <button
                className="mt-auto px-4 py-3 rounded-full bg-yellow-400 text-black font-bold hover:bg-yellow-300 active:scale-95 transition-colors text-base shadow-lg"
                onClick={() => addToCart(product)}
              >
                Agregar al carrito
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
} 