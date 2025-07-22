"use client";
import { useState, useEffect, useCallback } from 'react';
import { apiService, Order, Product, OrderStatus } from '../../../services/api-service';

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [restaurantId, setRestaurantId] = useState('ay-wey');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [updating, setUpdating] = useState<string | null>(null);

  // Estados para el formulario de añadir producto
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [addingProductTo, setAddingProductTo] = useState<string | null>(null);


  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const adminData = localStorage.getItem('admin_user');
      const currentRestaurantId = adminData ? JSON.parse(adminData).restaurant_id : 'ay-wey';
      setRestaurantId(currentRestaurantId);

      const [ordersResponse, productsResponse] = await Promise.all([
        apiService.getOrders(currentRestaurantId, statusFilter || undefined),
        apiService.getProducts(currentRestaurantId)
      ]);

      // Ya no se necesita el filtro de restaurant_id porque la API lo hace
      setOrders(ordersResponse.orders);
      setProducts(productsResponse.products);
      
    } catch (error) {
      console.error('Error cargando datos:', error);
      setError('Error cargando los datos del dashboard');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      setUpdating(orderId);
      await apiService.updateOrderStatus(orderId, newStatus, restaurantId);
      
      // Actualizar la orden en el estado local
      setOrders(orders.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus }
          : order
      ));
      
    } catch (error) {
      console.error('Error actualizando estado:', error);
      alert('Error actualizando el estado de la orden');
    } finally {
      setUpdating(null);
    }
  };

  const handleAddProduct = async (orderId: string) => {
    if (!selectedProduct || quantity <= 0) {
      alert("Por favor, selecciona un producto y una cantidad válida.");
      return;
    }

    try {
      setAddingProductTo(orderId);
      
      await apiService.addProductToOrder(orderId, selectedProduct, quantity, restaurantId);

      // Recargar los datos para ver los cambios
      await loadData();
      
      // Resetear formulario
      setSelectedProduct('');
      setQuantity(1);

    } catch (error) {
      console.error("Error añadiendo producto a la orden:", error);
      alert("Hubo un error al añadir el producto. Inténtalo de nuevo.");
    } finally {
      setAddingProductTo(null);
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    const colors: { [key in OrderStatus]?: string } = {
      PENDING: 'bg-yellow-600',
      CONFIRMED: 'bg-blue-600',
      PREPARING: 'bg-orange-600',
      READY: 'bg-green-600',
      DELIVERED: 'bg-gray-600',
      CANCELLED: 'bg-red-600'
    };
    return colors[status] || 'bg-gray-600';
  };

  const getStatusLabel = (status: OrderStatus) => {
    const labels: { [key in OrderStatus]?: string } = {
      PENDING: 'Pendiente',
      CONFIRMED: 'Confirmado',
      PREPARING: 'Preparando',
      READY: 'Listo',
      DELIVERED: 'Entregado',
      CANCELLED: 'Cancelado'
    };
    return labels[status] || status;
  };

  const getDeliveryIcon = (method: string) => {
    const icons = {
      mesa: '🪑',
      domicilio: '🚚',
      recoger: '🏪'
    };
    return icons[method as keyof typeof icons] || '📦';
  };

  const getDeliveryLabel = (method: string) => {
    const labels = {
      mesa: 'Mesa',
      domicilio: 'Domicilio',
      recoger: 'Para Recoger'
    };
    return labels[method as keyof typeof labels] || method;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatTimeElapsed = (createdAt: string) => {
    const now = new Date();
    const orderTime = new Date(createdAt);
    const diffMs = now.getTime() - orderTime.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 60) {
      return `${diffMins} min`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `${hours}h ${mins}m`;
    }
  };

  const statusOptions: { value: OrderStatus | ''; label: string }[] = [
    { value: '', label: 'Todos los estados' },
    { value: 'PENDING', label: 'Pendiente' },
    { value: 'CONFIRMED', label: 'Confirmado' },
    { value: 'PREPARING', label: 'Preparando' },
    { value: 'READY', label: 'Listo' },
    { value: 'DELIVERED', label: 'Entregado' },
    { value: 'CANCELLED', label: 'Cancelado' }
  ];

  const nextStatusOptions = (currentStatus: OrderStatus): OrderStatus[] => {
    const flow: { [key in OrderStatus]?: OrderStatus[] } = {
      PENDING: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['PREPARING', 'CANCELLED'],
      PREPARING: ['READY', 'CANCELLED'],
      READY: ['DELIVERED'],
    };
    return flow[currentStatus] || [];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando órdenes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con filtros */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Todas las Órdenes</h1>
          <p className="text-gray-500 capitalize">
            {restaurantId} • {orders.length} orden{orders.length !== 1 ? 'es' : ''}
          </p>
        </div>
        <div className="flex gap-4 items-center">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as OrderStatus)}
            className="px-4 py-2 bg-white text-gray-900 rounded-lg border border-gray-300 focus:ring-2 focus:ring-yellow-400"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-yellow-400 text-black rounded-lg hover:bg-yellow-500 transition-colors font-semibold"
            disabled={loading}
          >
            🔄 Actualizar
          </button>
        </div>
      </div>
      {/* Lista de órdenes */}
      {orders.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-2xl font-bold mb-2 text-gray-900">No hay órdenes</h3>
          <p className="text-gray-500">
            {statusFilter 
              ? `No se encontraron órdenes con estado "${getStatusLabel(statusFilter)}"`
              : 'No hay órdenes disponibles en este momento'
            }
          </p>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Información principal */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">#{order.id.substring(0, 8)}</h3>
                      <p className="text-gray-500 text-sm">{formatTimeElapsed(order.createdAt)} atrás</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-sm text-white ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                      <span className="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700 flex items-center gap-1">
                        {getDeliveryIcon(order.deliveryMethod)}
                        {getDeliveryLabel(order.deliveryMethod)}
                      </span>
                    </div>
                  </div>
                  {/* Información del cliente */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Cliente</p>
                      <p className="font-semibold text-gray-900">{order.customer.name}</p>
                      <p className="text-sm text-gray-700">{order.customer.phone}</p>
                      {order.customer.email && (
                        <p className="text-sm text-gray-700">{order.customer.email}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Entrega</p>
                      {order.deliveryMethod === 'DINE_IN' && order.mesa && (
                        <p className="font-semibold text-gray-900">Mesa: {order.mesa}</p>
                      )}
                      {order.deliveryMethod === 'DELIVERY' && order.deliveryAddress && (
                        <p className="font-semibold text-gray-900">{order.deliveryAddress}</p>
                      )}
                      {order.deliveryMethod === 'PICKUP' && (
                        <p className="font-semibold text-gray-900">Para recoger en local</p>
                      )}
                    </div>
                  </div>
                  {/* Productos y Total */}
                  <div className="space-y-2">
                    {order.products.map(product => (
                      <div key={product.id} className="flex justify-between items-center text-sm">
                        <span>
                          {product.name}
                          <span className="font-semibold text-yellow-500"> x{product.quantity}</span>
                        </span>
                        <span className="font-mono">{formatCurrency(product.price * product.quantity)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">Total</span>
                    <span className="text-xl font-bold text-yellow-500">{formatCurrency(order.total)}</span>
                  </div>
                  {/* FORMULARIO PARA AÑADIR PRODUCTO */}
                  <div className="mt-6 pt-4 border-t border-dashed border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Añadir Producto a la Orden</h4>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <select 
                        className="flex-grow bg-gray-100 border border-gray-300 rounded-md px-3 py-2 text-gray-900 text-sm"
                        value={selectedProduct}
                        onChange={(e) => setSelectedProduct(e.target.value)}
                        disabled={addingProductTo === order.id}
                      >
                        <option value="">Seleccionar producto...</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name} - {formatCurrency(p.price)}</option>
                        ))}
                      </select>
                      <input 
                        type="number"
                        min="1"
                        className="w-20 bg-gray-100 border border-gray-300 rounded-md px-3 py-2 text-gray-900 text-sm"
                        value={quantity}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                        disabled={addingProductTo === order.id}
                      />
                      <button
                        onClick={() => handleAddProduct(order.id)}
                        className="px-4 py-2 bg-green-500 text-white rounded-md text-sm font-semibold hover:bg-green-600 disabled:bg-gray-300 disabled:text-gray-500"
                        disabled={addingProductTo === order.id || !selectedProduct}
                      >
                        {addingProductTo === order.id ? 'Añadiendo...' : 'Añadir'}
                      </button>
                    </div>
                  </div>
                </div>
                {/* Acciones de estado */}
                <div className="lg:w-64 flex-shrink-0 space-y-2 mt-6 lg:mt-0">
                  <p className="text-sm text-gray-500 mb-2">Cambiar estado</p>
                  <div className="space-y-2">
                    {nextStatusOptions(order.status).map((status) => (
                      <button
                        key={status}
                        onClick={() => updateOrderStatus(order.id, status)}
                        disabled={updating === order.id}
                        className={`w-full px-4 py-3 rounded-lg text-base font-semibold transition-colors ${getStatusColor(status)} text-white hover:opacity-90 disabled:opacity-50`}
                      >
                        {updating === order.id ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Actualizando...
                          </div>
                        ) : (
                          `Marcar como ${getStatusLabel(status)}`
                        )}
                      </button>
                    ))}
                    {nextStatusOptions(order.status).length === 0 && (
                      <p className="text-sm text-gray-400 text-center py-4">
                        No hay acciones disponibles
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {error && (
        <div className="bg-red-500 text-white p-4 rounded-lg flex items-center gap-2">
          <span>❌</span>
          {error}
        </div>
      )}
    </div>
  );
} 