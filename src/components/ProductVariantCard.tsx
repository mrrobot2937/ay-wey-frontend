"use client";
import { useState } from "react";
import { useCart, Product } from "../contexts/CartContext";
import Image from "next/image";

export default function ProductVariantCard({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const [selected, setSelected] = useState(0);
  const [imageError, setImageError] = useState(false);
  
  // Verificar si el producto tiene variantes
  const hasVariants = Array.isArray(product.variants) && product.variants.length > 0;
  const variant = hasVariants && product.variants ? product.variants[selected] : null;

  // Imagen principal: la de la variante si existe, si no la del producto
  const mainImageUrl = hasVariants && product.variants && (product.variants[selected] as { imageUrl?: string })?.imageUrl
    ? (product.variants[selected] as { imageUrl?: string }).imageUrl
    : product.image_url;

  // Si no hay variantes, usar el precio base del producto
  const displayPrice = variant ? variant.price : product.price;
  const displaySize = variant ? variant.size : "Único";

  function handleAdd() {
    // Si hay variantes, usar la variante seleccionada
    if (hasVariants && variant) {
      addToCart(product, variant);
    } else {
      // Si no hay variantes, agregar el producto tal como está
      addToCart(product);
    }
  }

  return (
    <div className="bg-zinc-900 rounded-3xl p-4 shadow-2xl flex flex-col gap-3 border border-zinc-800 hover:border-yellow-400 transition-colors relative overflow-hidden group h-full">
      {/* Imagen del producto - Mejorada para imágenes cuadradas */}
      <div className="relative aspect-square w-full bg-zinc-800 rounded-2xl overflow-hidden mb-3">
        {mainImageUrl && !imageError ? (
          <Image 
            src={mainImageUrl} 
            alt={product.name} 
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImageError(true)}
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkrHB0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R+Rg=" 
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500">
            <div className="text-4xl mb-2">🍽️</div>
            <span className="text-sm font-medium">Sin imagen</span>
          </div>
        )}
      </div>

      {/* Miniaturas de variantes */}
      {hasVariants && (
        <div className="flex gap-2 justify-center mb-2">
          {product.variants!.map((v, i) => (
            <button
              key={v.size + i}
              className={`border-2 rounded-lg p-0.5 transition-all ${selected === i ? 'border-yellow-400' : 'border-zinc-700'}`}
              onClick={() => { setSelected(i); setImageError(false); }}
              aria-label={`Seleccionar variante ${v.size}`}
              type="button"
            >
              <div className="w-10 h-10 bg-zinc-800 rounded-md overflow-hidden flex items-center justify-center">
                {(v as { imageUrl?: string })?.imageUrl ? (
                  <Image
                    src={(v as { imageUrl?: string }).imageUrl!}
                    alt={v.size}
                    width={40}
                    height={40}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  product.image_url ? (
                    <Image
                      src={product.image_url}
                      alt={v.size}
                      width={40}
                      height={40}
                      className="object-cover w-full h-full opacity-50"
                    />
                  ) : (
                    <span className="text-zinc-500 text-lg">🍽️</span>
                  )
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Información del producto */}
      <div className="flex-1 flex flex-col">
        <h3 className="text-xl font-bold mb-2 line-clamp-2 leading-tight">{product.name}</h3>
        <p className="text-gray-300 mb-3 text-sm line-clamp-3 leading-relaxed">{product.description}</p>
        
        {/* Categoría */}
        {product.category && (
          <div className="mb-3">
            <span className="inline-block px-3 py-1 text-xs bg-yellow-400 text-black rounded-full font-bold">
              {typeof product.category === 'string' ? product.category : product.category.name}
            </span>
          </div>
        )}

        {/* Selector de variante (si las hay) */}
        {hasVariants && (
          <div className="mb-3">
            <p className="text-sm text-gray-400 mb-2 font-medium">Tamaño:</p>
            <div className="flex gap-2 flex-wrap">
              {product.variants!.map((v, i) => (
                <button
                  key={`${v.size}-${i}`}
                  className={`px-3 py-1 rounded-full font-bold border-2 transition-colors text-sm ${
                    selected === i 
                      ? 'bg-yellow-400 text-black border-yellow-400 shadow' 
                      : 'bg-zinc-800 border-zinc-700 text-white hover:bg-yellow-400 hover:text-black'
                  }`}
                  onClick={() => { setSelected(i); setImageError(false); }}
                >
                  {v.size}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Precio y tiempo de preparación */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-yellow-400 font-extrabold text-lg">
            ${displayPrice.toLocaleString()}
          </span>
          {product.preparation_time && (
            <span className="text-gray-400 text-xs font-medium">
              ⏱️ {product.preparation_time} min
            </span>
          )}
        </div>

        {/* Estado de disponibilidad */}
        {product.is_available === false && (
          <div className="mb-3">
            <span className="inline-block px-3 py-1 text-xs bg-red-500 text-white rounded-full font-bold">
              No disponible
            </span>
          </div>
        )}

        {/* Botón de agregar */}
        <button
          className={`mt-auto px-4 py-3 rounded-full font-bold transition-colors text-base shadow-lg ${
            product.is_available === false
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-yellow-400 text-black hover:bg-yellow-300 active:scale-95'
          }`}
          onClick={handleAdd}
          disabled={product.is_available === false}
        >
          {product.is_available === false 
            ? 'No disponible' 
            : hasVariants 
              ? `Agregar ${displaySize}` 
              : 'Agregar al carrito'
          }
        </button>
      </div>
    </div>
  );
} 