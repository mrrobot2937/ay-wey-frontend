"use client";
import { useState, useEffect, useCallback } from 'react';
import { apiService, Order } from '../../../services/api-service';

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [restaurantId, setRestaurantId] = useState('ay-wey');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [updating, setUpdating] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      // Obtener datos del usuario admin
      const adminData = localStorage.getItem('admin_user');
      if (adminData) {
        const userData = JSON.parse(adminData);
        setRestaurantId(userData.restaurant_id || 'ay-wey');
      }

      const response = await apiService.getOrders('ay-wey', statusFilter || undefined);
      setOrders(response.orders.filter(order => order.restaurant_id === 'ay-wey'));
      
    } catch (error) {
      console.error('Error cargando órdenes:', error);
      setError('Error cargando las órdenes');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadOrders();
    // REMOVIDO: Intervalo duplicado - usar solo el hook de notificaciones
  }, [loadOrders]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      setUpdating(orderId);
      await apiService.updateOrderStatus(orderId, newStatus, restaurantId);
      
      // Actualizar la orden en el estado local
      setOrders(orders.map(order => 
        order.order_id === orderId 
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

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-600',
      confirmed: 'bg-blue-600',
      preparing: 'bg-orange-600',
      ready: 'bg-green-600',
      delivered: 'bg-gray-600',
      cancelled: 'bg-red-600'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-600';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      pending: 'Pendiente',
      confirmed: 'Confirmado',
      preparing: 'Preparando',
      ready: 'Listo',
      delivered: 'Entregado',
      cancelled: 'Cancelado'
    };
    return labels[status as keyof typeof labels] || status;
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

  const statusOptions = [
    { value: '', label: 'Todos los estados' },
    { value: 'pending', label: 'Pendiente' },
    { value: 'confirmed', label: 'Confirmado' },
    { value: 'preparing', label: 'Preparando' },
    { value: 'ready', label: 'Listo' },
    { value: 'delivered', label: 'Entregado' },
    { value: 'cancelled', label: 'Cancelado' }
  ];

  const nextStatusOptions = (currentStatus: string) => {
    const flow = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['preparing', 'cancelled'],
      preparing: ['ready', 'cancelled'],
      ready: ['delivered'],
      delivered: [],
      cancelled: []
    };
    return flow[currentStatus as keyof typeof flow] || [];
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
          <h1 className="text-2xl font-bold text-white">Todas las Órdenes</h1>
          <p className="text-gray-400 capitalize">
            {restaurantId} • {orders.length} orden{orders.length !== 1 ? 'es' : ''}
          </p>
        </div>
        
        <div className="flex gap-4 items-center">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-600 focus:ring-2 focus:ring-yellow-400"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          <button
            onClick={loadOrders}
            className="px-4 py-2 bg-yellow-600 text-black rounded-lg hover:bg-yellow-700 transition-colors"
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
          <h3 className="text-2xl font-bold mb-2">No hay órdenes</h3>
          <p className="text-gray-400">
            {statusFilter 
              ? `No se encontraron órdenes con estado "${getStatusLabel(statusFilter)}"`
              : 'No hay órdenes disponibles en este momento'
            }
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {orders.map((order) => (
            <div key={order.order_id} className="bg-gray-800 rounded-lg border border-gray-700 p-6">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Información principal */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white">#{order.order_id}</h3>
                      <p className="text-gray-400 text-sm">{formatTimeElapsed(order.created_at)} atrás</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-sm text-white ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                      <span className="px-3 py-1 rounded-full text-sm bg-gray-700 text-white flex items-center gap-1">
                        {getDeliveryIcon(order.delivery_method)}
                        {getDeliveryLabel(order.delivery_method)}
                      </span>
                    </div>
                  </div>

                  {/* Información del cliente */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-400">Cliente</p>
                      <p className="font-semibold text-white">{order.customer_name}</p>
                      <p className="text-sm text-gray-300">{order.customer_phone}</p>
                      {order.customer_email && (
                        <p className="text-sm text-gray-300">{order.customer_email}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Entrega</p>
                      {order.delivery_method === 'mesa' && order.mesa && (
                        <p className="font-semibold text-white">Mesa: {order.mesa}</p>
                      )}
                      {order.delivery_method === 'domicilio' && order.direccion && (
                        <p className="font-semibold text-white">{order.direccion}</p>
                      )}
                      {order.delivery_method === 'recoger' && (
                        <p className="font-semibold text-white">Para recoger en local</p>
                      )}
                    </div>
                  </div>

                  {/* Productos */}
                  <div className="mb-4">
                    <p className="text-sm text-gray-400 mb-2">Productos ({order.products.length})</p>
                    <div className="space-y-1">
                      {order.products.map((product, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <span className="text-gray-300">
                            {product.nombre || product.name || `Producto ${product.id}`} x{product.cantidad}
                          </span>
                          <span className="text-yellow-400 font-semibold">
                            {formatCurrency(product.precio * product.cantidad)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Total */}
                  <div className="flex justify-between items-center pt-4 border-t border-gray-700">
                    <span className="text-lg font-bold text-white">Total</span>
                    <span className="text-2xl font-bold text-yellow-400">
                      {formatCurrency(order.total)}
                    </span>
                  </div>
                </div>

                {/* Acciones */}
                <div className="lg:w-64">
                  <p className="text-sm text-gray-400 mb-2">Cambiar estado</p>
                  <div className="space-y-2">
                    {nextStatusOptions(order.status).map((status) => (
                      <button
                        key={status}
                        onClick={() => updateOrderStatus(order.order_id, status)}
                        disabled={updating === order.order_id}
                        className={`w-full px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${getStatusColor(status)} text-white hover:opacity-80 disabled:opacity-50`}
                      >
                        {updating === order.order_id ? (
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
                      <p className="text-sm text-gray-500 text-center py-4">
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
        <div className="bg-red-600 text-white p-4 rounded-lg flex items-center gap-2">
          <span>❌</span>
          {error}
        </div>
      )}
    </div>
  );
} 