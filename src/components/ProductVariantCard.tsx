"use client";
import { useState } from "react";
import { useCart, Product } from "../contexts/CartContext";
import Image from "next/image";

// Extiende el tipo Product para soportar imageUrl e image_url
interface ProductWithImageCompat extends Product {
  imageUrl?: string;
  image_url?: string;
  variants?: Array<{ size: string; price: number; imageUrl?: string; image_url?: string }>;
}

export default function ProductVariantCard({ product }: { product: ProductWithImageCompat }) {
  const { addToCart } = useCart();
  const [selected, setSelected] = useState(0);
  const [imageError, setImageError] = useState(false);
  
  // Verificar si el producto tiene variantes
  const hasVariants = Array.isArray(product.variants) && product.variants.length > 0;
  const variant = hasVariants && product.variants ? product.variants[selected] : null;

  // Imagen principal: la de la variante si existe, si no la del producto
  const mainImageUrl = hasVariants && product.variants && ((product.variants[selected] as { imageUrl?: string; image_url?: string })?.imageUrl || (product.variants[selected] as { imageUrl?: string; image_url?: string })?.image_url)
    ? ((product.variants[selected] as { imageUrl?: string; image_url?: string })?.imageUrl || (product.variants[selected] as { imageUrl?: string; image_url?: string })?.image_url)
    : (product.imageUrl || product.image_url);

  // Si no hay variantes, usar el precio base del producto
  const displayPrice = variant ? variant.price : product.price;

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
    <div className="bg-gray-100 rounded-3xl p-4 shadow-2xl flex flex-col gap-3 border border-gray-200 hover:border-yellow-400 transition-colors relative overflow-hidden group h-full">
      {/* Imagen del producto - Mejorada para imágenes cuadradas */}
      <div className="relative aspect-square w-full bg-gray-100 rounded-2xl overflow-hidden mb-3">
        {mainImageUrl && !imageError ? (
          // Solo renderiza <Image> si mainImageUrl existe
          <Image 
            src={mainImageUrl as string} 
            alt={product.name} 
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImageError(true)}
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkrHB0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R+Rg=" 
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
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
              className={`border-2 rounded-lg p-0.5 transition-all ${selected === i ? 'border-yellow-400' : 'border-gray-200'}`}
              onClick={() => { setSelected(i); setImageError(false); }}
              aria-label={`Seleccionar variante ${v.size}`}
              type="button"
            >
              <div className="w-10 h-10 bg-gray-100 rounded-md overflow-hidden flex items-center justify-center">
                {((v as { imageUrl?: string; image_url?: string })?.imageUrl || (v as { imageUrl?: string; image_url?: string })?.image_url) ? (
                  <Image
                    src={((v as { imageUrl?: string; image_url?: string })?.imageUrl || (v as { imageUrl?: string; image_url?: string })?.image_url) as string}
                    alt={v.size}
                    width={40}
                    height={40}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  (product.imageUrl || product.image_url) ? (
                    <Image
                      src={(product.imageUrl || product.image_url) as string}
                      alt={v.size}
                      width={40}
                      height={40}
                      className="object-cover w-full h-full opacity-50"
                    />
                  ) : (
                    <span className="text-gray-400 text-lg">🍽️</span>
                  )
                )}
              </div>
            </button>
          ))}
        </div>
      )}
      {/* Información del producto */}
      <div className="flex-1 flex flex-col">
        <h3 className="text-xl font-bold mb-2 line-clamp-2 leading-tight text-gray-900">{product.name}</h3>
        <p className="text-gray-500 mb-3 text-sm line-clamp-3 leading-relaxed">{product.description}</p>
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
            <p className="text-sm text-gray-500 mb-2 font-medium">Tamaño:</p>
            <div className="flex gap-2 flex-wrap">
              {product.variants!.map((v, i) => (
                <button
                  key={`${v.size}-${i}`}
                  className={`px-3 py-1 rounded-full font-bold border-2 transition-colors text-sm ${
                    selected === i 
                      ? 'bg-yellow-400 text-black border-yellow-400 shadow' 
                      : 'bg-gray-100 border-gray-200 text-gray-900 hover:bg-yellow-400 hover:text-black'
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
          <span className="text-yellow-500 font-extrabold text-lg">
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
          className="mt-auto px-4 py-3 rounded-full bg-yellow-400 text-black font-bold hover:bg-yellow-300 active:scale-95 transition-colors text-base shadow-lg"
          onClick={handleAdd}
        >
          Agregar al carrito
        </button>
      </div>
    </div>
  );
} 