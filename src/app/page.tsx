"use client";
import { useState, useEffect } from "react";
import { useCart } from "../contexts/CartContext";
import { apiService, Product } from "../services/api-service";
import ProductVariantCard from "../components/ProductVariantCard";

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { restaurantId } = useCart();

  // Función helper para obtener el nombre de la categoría de manera segura
  const getCategoryName = (category: string | { id: string; name: string } | undefined | null): string => {
    if (!category) return 'Sin categoría';
    if (typeof category === 'string') return category;
    if (typeof category === 'object' && category.name) return category.name;
    return 'Sin categoría';
  };

  // Obtener categorías únicas de los productos
  const categories = Array.from(new Set(products.map(p => getCategoryName(p.category)).filter(Boolean)));

  // Filtrar productos por categoría seleccionada
  const filteredProducts = selectedCategory 
    ? products.filter(p => getCategoryName(p.category) === selectedCategory)
    : products;

  // Agrupar productos por categoría
  const productsByCategory = filteredProducts.reduce((acc, product) => {
    const categoryName = getCategoryName(product.category);
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await apiService.getProducts(restaurantId);
        setProducts(response.products);
      } catch (err) {
        console.error('Error cargando productos:', err);
        setError('Error cargando el menú. Por favor, intenta nuevamente.');
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [restaurantId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-lg">Cargando menú...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white text-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2">Error</h2>
          <p className="text-gray-500 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-yellow-400 text-black px-6 py-2 rounded-lg font-bold hover:bg-yellow-500 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Barra de filtros fija */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 py-4 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-extrabold text-center mb-2 text-yellow-500">Ay Wey</h1>
          <p className="text-center text-gray-500 mb-6">
            Menú • {products.length} productos disponibles
          </p>
          {/* Contenedor con scroll horizontal */}
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
            <button
              className={`px-5 py-2 rounded-full font-bold border-2 transition-colors whitespace-nowrap flex-shrink-0 ${
                selectedCategory === null 
                  ? 'bg-yellow-400 text-black border-yellow-400 shadow' 
                  : 'bg-white border-gray-300 text-gray-900 hover:bg-yellow-400 hover:text-black'
              }`}
              onClick={() => setSelectedCategory(null)}
            >
              Todos ({products.length})
            </button>
            {categories.map((category) => {
              const count = products.filter(p => getCategoryName(p.category) === category).length;
              return (
                <button
                  key={category}
                  className={`px-5 py-2 rounded-full font-bold border-2 transition-colors whitespace-nowrap flex-shrink-0 ${
                    selectedCategory === category 
                      ? 'bg-yellow-400 text-black border-yellow-400 shadow' 
                      : 'bg-white border-gray-300 text-gray-900 hover:bg-yellow-400 hover:text-black'
                  }`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>
      {/* Contenido del menú */}
      <div className="px-4 py-8">
        {Object.entries(productsByCategory).map(([categoryName, categoryProducts]) => (
          <section key={categoryName} className="mb-12">
            <h2 className="text-2xl font-bold mb-4 border-b border-yellow-400 pb-2 flex items-center justify-between text-gray-900">
              <span>{categoryName}</span>
              <span className="text-sm text-gray-500 font-normal">
                {categoryProducts.length} producto{categoryProducts.length !== 1 ? 's' : ''}
              </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {categoryProducts.map((product) => (
                <ProductVariantCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        ))}
        {filteredProducts.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🍽️</div>
            <h3 className="text-2xl font-bold mb-2 text-gray-900">No hay productos disponibles</h3>
            <p className="text-gray-500">
              {selectedCategory 
                ? `No se encontraron productos en la categoría "${selectedCategory}"`
                : 'No hay productos disponibles en este momento'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
