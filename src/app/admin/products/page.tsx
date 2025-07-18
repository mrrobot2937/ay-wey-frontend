"use client";
import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { apiService, Product } from '../../../services/api-service';
import { useToast, ToastManager } from '../../../components/Toast';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [restaurantId, setRestaurantId] = useState('ay-wey');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Array<{id: string, name: string}>>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const { toasts, removeToast, showSuccess, showError, showInfo } = useToast();
  const [filters, setFilters] = useState({
    category: '',
    search: '',
    available: ''
  });
  const [sortBy, setSortBy] = useState('name');

  // Ref para evitar llamadas duplicadas
  const loadingRef = useRef(false);
  const lastRestaurantIdRef = useRef<string>('');

  // Datos del formulario
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image_url: '',
    available: true,
    variants: [] as Array<{ size: string; price: string; imageUrl?: string }>
  });

  const loadProducts = useCallback(async () => {
    // Evitar llamadas duplicadas
    if (loadingRef.current) {
      console.log('🔄 Ya hay una carga de productos en progreso, omitiendo...');
      return;
    }

    // Verificar si el restaurantId cambió
    if (lastRestaurantIdRef.current === restaurantId && products.length > 0) {
      console.log('🔄 RestaurantId no cambió y ya hay productos, omitiendo carga...');
      return;
    }

    try {
      loadingRef.current = true;
      setLoading(true);
      setError('');
      showInfo('Cargando productos...');
      
      // Obtener datos del usuario admin
      const adminData = localStorage.getItem('admin_user');
      let currentRestaurantId = restaurantId;
      
      if (adminData) {
        const userData = JSON.parse(adminData);
        currentRestaurantId = userData.restaurant_id || 'ay-wey';
        
        // Solo actualizar si realmente cambió
        if (currentRestaurantId !== restaurantId) {
          setRestaurantId(currentRestaurantId);
        }
      }

      console.log(`🔄 Cargando productos para restaurante: ${currentRestaurantId}`);
      const response = await apiService.getProducts(currentRestaurantId);
      console.log(`✅ Productos cargados: ${response.products.length}`);
      
      setProducts(response.products);
      lastRestaurantIdRef.current = currentRestaurantId;
      showSuccess(`Se cargaron ${response.products.length} productos exitosamente`);
      
    } catch (error) {
      console.error('Error cargando productos:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido cargando los productos';
      setError(errorMessage);
      showError(`Error cargando productos:\n${errorMessage}`);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [restaurantId, products.length]); // Removidas las dependencias problemáticas de toast

  const applyFilters = useCallback(() => {
    let filtered = [...products];

    // Filtrar por categoría
    if (filters.category) {
      filtered = filtered.filter(product => getCategoryName(product.category) === filters.category);
    }

    // Filtrar por disponibilidad
    if (filters.available) {
      const isAvailable = filters.available === 'true';
      filtered = filtered.filter(product => product.available === isAvailable);
    }

    // Búsqueda por nombre
    if (filters.search) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        product.description.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Ordenar
    switch (sortBy) {
      case 'price_high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'price_low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'category':
        filtered.sort((a, b) => getCategoryName(a.category).localeCompare(getCategoryName(b.category)));
        break;
      case 'name':
      default:
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    setFilteredProducts(filtered);
  }, [products, filters, sortBy]);

  // Cargar productos solo una vez al montar
  useEffect(() => {
    console.log('🏪 PRODUCTS: Iniciando carga de productos...');
    loadProducts();
  }, []); // Solo se ejecuta al montar

  // Efecto separado para recargar cuando cambie el restaurantId
  useEffect(() => {
    if (restaurantId && restaurantId !== lastRestaurantIdRef.current) {
      console.log(`🔄 PRODUCTS: RestaurantId cambió a ${restaurantId}, recargando productos...`);
      loadProducts();
    }
  }, [restaurantId]); // Solo cuando cambie restaurantId

  useEffect(() => {
    if (products.length > 0) {
      applyFilters();
    }
  }, [products, filters, sortBy, applyFilters]);

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await apiService.getCategories(restaurantId);
      setCategories(response.categories);
    } catch (error) {
      console.error('Error cargando categorías:', error);
      // No mostrar error crítico, solo log
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      search: '',
      available: ''
    });
    setSortBy('name');
  };

  const getCategoryName = (category: string | { id: string; name: string } | undefined | null): string => {
    if (!category) return '';
    if (typeof category === 'string') return category;
    if (typeof category === 'object' && category.name) return category.name;
    return '';
  };

  const getUniqueCategories = () => {
    const categories = products
      .map(product => getCategoryName(product.category))
      .filter(category => category && category.trim() !== '');
    return [...new Set(categories)].sort();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price.toString(),
        category: getCategoryName(product.category),
        image_url: product.image_url || '',
        available: product.available,
        variants: Array.isArray(product.variants)
          ? product.variants.map((v: { size: string; price: number; imageUrl?: string }) => ({
              size: v.size,
              price: v.price.toString(),
              imageUrl: v.imageUrl || ''
            }))
          : []
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        category: '',
        image_url: '',
        available: true,
        variants: []
      });
    }
    setShowModal(true);
    // Cargar categorías cuando se abre el modal
    loadCategories();
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      category: '',
      image_url: '',
      available: true,
      variants: []
    });
  };

  const handleVariantChange = (index: number, key: string, value: string) => {
    setFormData((prev) => {
      const newVariants = [...prev.variants];
      newVariants[index] = { ...newVariants[index], [key]: value };
      return { ...prev, variants: newVariants };
    });
  };
  const addVariant = () => {
    setFormData((prev) => ({
      ...prev,
      variants: [...prev.variants, { size: '', price: '', imageUrl: '' }]
    }));
  };
  const removeVariant = (index: number) => {
    setFormData((prev) => {
      const newVariants = [...prev.variants];
      newVariants.splice(index, 1);
      return { ...prev, variants: newVariants };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.description || !formData.price || !formData.category) {
      showError('Por favor completa todos los campos obligatorios');
      return;
    }

    // Validar variantes
    for (const v of formData.variants) {
      if (!v.size || !v.price) {
        showError('Todas las variantes deben tener tamaño y precio');
        return;
      }
    }

    try {
      console.log('🔍 Debug categoría:', {
        formDataCategory: formData.category,
        categories: categories.map(c => ({ id: c.id, name: c.name })),
        restaurantId
      });
      
      // Manejar categorías predefinidas
      let categoryId = formData.category;
      
      // Si es una categoría predefinida, intentar crearla primero
      const predefinedCategories = {
        'platos-principales': 'Platos Principales',
        'acompañamientos': 'Acompañamientos', 
        'bebidas': 'Bebidas',
        'postres': 'Postres',
        'entradas': 'Entradas'
      };
      
      if (predefinedCategories[categoryId as keyof typeof predefinedCategories]) {
        const categoryName = predefinedCategories[categoryId as keyof typeof predefinedCategories];
        
        try {
          // Intentar crear la categoría si no existe
          console.log(`🔄 Intentando crear categoría: ${categoryName}`);
          const categoryResult = await apiService.createCategory({
            name: categoryName,
            description: `Categoría para ${categoryName.toLowerCase()}`
          }, restaurantId);
          
          if (categoryResult.success) {
            categoryId = categoryResult.id;
            console.log(`✅ Categoría creada exitosamente: ${categoryId}`);
          } else {
            // Si no se puede crear, usar un ID temporal
            categoryId = `cat_${categoryName.toLowerCase().replace(/\s+/g, '_')}`;
          }
        } catch (error) {
          console.warn(`⚠️ No se pudo crear categoría ${categoryName}, usando ID temporal`);
          categoryId = `cat_${categoryName.toLowerCase().replace(/\s+/g, '_')}`;
        }
      }
      
      // Validar que la categoría no esté vacía
      if (!categoryId || categoryId.trim() === '') {
        throw new Error('Debes seleccionar una categoría válida');
      }
      
      console.log('🔍 Categoría final:', categoryId);
      
      const productData: {
        name: string;
        description: string;
        price: number;
        category: string;
        image_url?: string;
        available: boolean;
        restaurant_id: string;
        variants?: Array<{
          size: string;
          price: number;
          imageUrl?: string;
        }>;
      } = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        category: categoryId,
        image_url: formData.image_url,
        available: formData.available,
        restaurant_id: restaurantId
      };
      // Siempre incluir variantes, incluso si es un array vacío
      productData.variants = formData.variants.map(v => ({
        size: v.size,
        price: parseFloat(v.price),
        imageUrl: v.imageUrl || undefined
      }));
      if (editingProduct) {
        // Para editar, necesitamos el originalId
        if (!editingProduct.originalId) {
          throw new Error('No se encontró el ID original del producto');
        }
        await apiService.updateProduct(editingProduct.id, productData, restaurantId, editingProduct.originalId);
        showSuccess('Producto actualizado exitosamente');
      } else {
        await apiService.createProduct(productData, restaurantId);
        showSuccess('Producto creado exitosamente');
      }

      closeModal();
      loadProducts();
    } catch (error) {
      console.error('Error guardando producto:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      showError(`Error guardando el producto:\n${errorMessage}`);
    }
  };

  const toggleAvailability = async (productId: number, currentAvailability: boolean) => {
    try {
      // Buscar el producto en los productos ya cargados para obtener el originalId
      const product = products.find(p => p.id === productId);
      
      console.log('🔍 Debug toggleAvailability:', {
        productId,
        currentAvailability,
        product: product ? { id: product.id, name: product.name, originalId: product.originalId } : null,
        allProductIds: products.map(p => ({ id: p.id, originalId: p.originalId, name: p.name }))
      });
      
      if (!product || !product.originalId) {
        throw new Error('No se encontró el producto o falta el ID original');
      }

      // Incluir las variantes existentes para que no se pierdan
      const updateData = { 
        available: !currentAvailability,
        variants: (product.variants || []).map((v: { size: string; price: number; image_url?: string; imageUrl?: string }) => ({
          size: v.size,
          price: v.price,
          imageUrl: v.image_url || v.imageUrl || undefined
        }))
      };

      await apiService.updateProduct(productId, updateData, restaurantId, product.originalId);
      const newStatus = !currentAvailability ? 'disponible' : 'no disponible';
      showSuccess(`Producto marcado como ${newStatus}`);
      loadProducts();
    } catch (error) {
      console.error('Error actualizando disponibilidad:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      showError(`Error actualizando la disponibilidad:\n${errorMessage}`);
    }
  };

  const deleteProduct = async (productId: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      return;
    }

    try {
      // Buscar el producto en los productos ya cargados para obtener el originalId
      const product = products.find(p => p.id === productId);
      if (!product || !product.originalId) {
        throw new Error('No se encontró el producto o falta el ID original');
      }

      await apiService.deleteProduct(productId, restaurantId, product.originalId);
      showSuccess('Producto eliminado exitosamente');
      loadProducts();
    } catch (error) {
      console.error('Error eliminando producto:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      showError(`Error eliminando el producto:\n${errorMessage}`);
    }
  };

  if (loading) {
    return (
      <>
        <ToastManager toasts={toasts} removeToast={removeToast} />
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-400 mx-auto mb-4"></div>
            <p className="text-gray-400">Cargando productos...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <ToastManager toasts={toasts} removeToast={removeToast} />
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Gestión de Productos</h1>
          <button
            onClick={() => openModal()}
            className="px-4 py-2 bg-yellow-600 text-black rounded-lg hover:bg-yellow-700 transition-colors font-semibold"
          >
            ➕ Agregar Producto
          </button>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <p className="text-2xl font-bold text-white">{products.length}</p>
            <p className="text-gray-400 text-sm">Total Productos</p>
          </div>
          <div className="bg-green-600 rounded-lg p-4">
            <p className="text-2xl font-bold text-white">
              {products.filter(p => p.available).length}
            </p>
            <p className="text-gray-200 text-sm">Disponibles</p>
          </div>
          <div className="bg-red-600 rounded-lg p-4">
            <p className="text-2xl font-bold text-white">
              {products.filter(p => !p.available).length}
            </p>
            <p className="text-gray-200 text-sm">No Disponibles</p>
          </div>
          <div className="bg-blue-600 rounded-lg p-4">
            <p className="text-2xl font-bold text-white">{getUniqueCategories().length}</p>
            <p className="text-gray-200 text-sm">Categorías</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-gray-300 text-sm mb-2">Categoría:</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded focus:outline-none focus:border-yellow-500"
              >
                <option value="">Todas las categorías</option>
                {getUniqueCategories().map((category, index) => (
                  <option key={`category-${index}-${category}`} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-300 text-sm mb-2">Disponibilidad:</label>
              <select
                value={filters.available}
                onChange={(e) => handleFilterChange('available', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded focus:outline-none focus:border-yellow-500"
              >
                <option value="">Todos</option>
                <option value="true">Disponibles</option>
                <option value="false">No Disponibles</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-300 text-sm mb-2">Buscar:</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Nombre o descripción"
                className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded focus:outline-none focus:border-yellow-500"
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm mb-2">Ordenar por:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded focus:outline-none focus:border-yellow-500"
              >
                <option value="name">Nombre</option>
                <option value="category">Categoría</option>
                <option value="price_high">Precio (Mayor)</option>
                <option value="price_low">Precio (Menor)</option>
              </select>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={loadProducts}
              className="px-4 py-2 bg-yellow-600 text-black rounded hover:bg-yellow-700 transition-colors"
            >
              🔄 Actualizar
            </button>
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-600 text-white p-4 rounded-lg flex items-center gap-2">
            <span>❌</span>
            {error}
          </div>
        )}

        {/* Lista de productos */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">
            Productos ({filteredProducts.length})
          </h3>

          {filteredProducts.length === 0 ? (
            <div className="bg-gray-800 rounded-lg p-8 text-center border border-gray-700">
              <span className="text-6xl mb-4 block">🍽️</span>
              <h3 className="text-xl font-semibold text-white mb-2">No hay productos</h3>
              <p className="text-gray-400">
                {products.length === 0 
                  ? 'No tienes productos registrados. ¡Agrega tu primer producto!'
                  : 'No hay productos que coincidan con los filtros aplicados.'
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((product) => (
                <div key={product.id} className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                  {/* Imagen */}
                  <div className="mb-4">
                    {product.image_url ? (
                      <Image
                        src={product.image_url}
                        alt={product.name}
                        width={300}
                        height={192}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-700 rounded-lg flex items-center justify-center">
                        <span className="text-6xl">🍽️</span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="mb-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-bold text-white">{product.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        product.available 
                          ? 'bg-green-600 text-white' 
                          : 'bg-red-600 text-white'
                      }`}>
                        {product.available ? 'Disponible' : 'No disponible'}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm mb-2">{product.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-yellow-400 font-bold text-lg">
                        {formatCurrency(product.price)}
                      </span>
                      <span className="text-gray-400 text-sm bg-gray-700 px-2 py-1 rounded">
                        {getCategoryName(product.category)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openModal(product)}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() => toggleAvailability(product.id, product.available)}
                      className={`flex-1 px-3 py-2 rounded text-sm transition-colors ${
                        product.available 
                          ? 'bg-orange-600 text-white hover:bg-orange-700' 
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {product.available ? '🚫 Desactivar' : '✅ Activar'}
                    </button>
                    <button
                      onClick={() => deleteProduct(product.id)}
                      className="px-3 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-4">
                {editingProduct ? 'Editar Producto' : 'Agregar Producto'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Nombre *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded focus:outline-none focus:border-yellow-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm mb-2">Descripción *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded focus:outline-none focus:border-yellow-500"
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm mb-2">Precio *</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded focus:outline-none focus:border-yellow-500"
                    min="0"
                    step="100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm mb-2">Categoría *</label>
                  {loadingCategories ? (
                    <div className="w-full px-3 py-2 bg-gray-700 text-gray-400 border border-gray-600 rounded">
                      Cargando categorías...
                    </div>
                  ) : (
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded focus:outline-none focus:border-yellow-500"
                      required
                    >
                      <option value="">Selecciona una categoría</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                      {/* Opción para crear nueva categoría */}
                      <option value="platos-principales">Platos Principales</option>
                      <option value="acompañamientos">Acompañamientos</option>
                      <option value="bebidas">Bebidas</option>
                      <option value="postres">Postres</option>
                      <option value="entradas">Entradas</option>
                    </select>
                  )}
                  <p className="text-gray-400 text-xs mt-1">
                    Si no encuentras la categoría, puedes usar una de las opciones predefinidas
                  </p>
                </div>

                <div>
                  <label className="block text-gray-300 text-sm mb-2">URL de Imagen</label>
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded focus:outline-none focus:border-yellow-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm mb-2">Variantes</label>
                  {formData.variants.map((variant, i) => (
                    <div key={i} className="flex gap-2 mb-2 items-center">
                      <input
                        type="text"
                        placeholder="Tamaño"
                        value={variant.size}
                        onChange={e => handleVariantChange(i, 'size', e.target.value)}
                        className="px-2 py-1 bg-gray-700 text-white border border-gray-600 rounded w-24"
                        required
                      />
                      <input
                        type="number"
                        placeholder="Precio"
                        value={variant.price}
                        onChange={e => handleVariantChange(i, 'price', e.target.value)}
                        className="px-2 py-1 bg-gray-700 text-white border border-gray-600 rounded w-24"
                        min="0"
                        required
                      />
                      <input
                        type="url"
                        placeholder="URL Imagen (opcional)"
                        value={variant.imageUrl || ''}
                        onChange={e => handleVariantChange(i, 'imageUrl', e.target.value)}
                        className="px-2 py-1 bg-gray-700 text-white border border-gray-600 rounded flex-1"
                      />
                      <button type="button" onClick={() => removeVariant(i)} className="text-red-400 hover:text-red-600 text-xl">×</button>
                    </div>
                  ))}
                  <button type="button" onClick={addVariant} className="mt-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">+ Añadir variante</button>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="available"
                    checked={formData.available}
                    onChange={(e) => setFormData({...formData, available: e.target.checked})}
                    className="mr-2"
                  />
                  <label htmlFor="available" className="text-gray-300 text-sm">
                    Producto disponible
                  </label>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-yellow-600 text-black rounded hover:bg-yellow-700 transition-colors font-semibold"
                  >
                    {editingProduct ? 'Actualizar' : 'Crear'} Producto
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
} 