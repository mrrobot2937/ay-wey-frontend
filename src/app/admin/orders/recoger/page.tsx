"use client";
import { useState, useEffect, useCallback } from 'react';
import { apiService, Order } from '../../../../services/api-service';

export default function RecogerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [restaurantId, setRestaurantId] = useState('ay-wey');
  const [filters, setFilters] = useState({
    status: '',
    search: ''
  });
  const [sortBy, setSortBy] = useState('newest');

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

      // Cargar órdenes para recoger
      const response = await apiService.getOrders('ay-wey');
      const recogerOrders = response.orders.filter(order => order.restaurant_id === 'ay-wey' && order.delivery_method === 'recoger');
      setOrders(recogerOrders);
      
    } catch (error) {
      console.error('Error cargando órdenes:', error);
      setError('Error cargando las órdenes para recoger');
    } finally {
      setLoading(false);
    }
  }, []);

  const applyFilters = useCallback(() => {
    let filtered = [...orders];

    // Filtrar por estado
    if (filters.status) {
      filtered = filtered.filter(order => order.status === filters.status);
    }

    // Búsqueda por nombre del cliente
    if (filters.search) {
      filtered = filtered.filter(order =>
        order.customer_name.toLowerCase().includes(filters.search.toLowerCase()) ||
        order.customer_phone.includes(filters.search) ||
        order.order_id.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Ordenar
    switch (sortBy) {
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'amount_high':
        filtered.sort((a, b) => b.total - a.total);
        break;
      case 'amount_low':
        filtered.sort((a, b) => a.total - b.total);
        break;
      case 'newest':
      default:
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
    }

    setFilteredOrders(filtered);
  }, [orders, filters, sortBy]);

  useEffect(() => {
    loadOrders();
    // REMOVIDO: Intervalo duplicado - usar solo el hook de notificaciones
  }, [loadOrders]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      search: ''
    });
    setSortBy('newest');
  };

  const getStatusCount = (status: string) => {
    return orders.filter(order => order.status === status).length;
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      pending: 'Pendientes',
      confirmed: 'Confirmados',
      preparing: 'Preparando',
      ready: 'Listos para Recoger',
      delivered: 'Recogidos',
      cancelled: 'Cancelados'
    };
    return labels[status as keyof typeof labels] || status;
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

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
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
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando órdenes para recoger...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <p className="text-2xl font-bold text-white">{orders.length}</p>
          <p className="text-gray-400 text-sm">Total Para Recoger</p>
        </div>
        <div className="bg-yellow-600 rounded-lg p-4">
          <p className="text-2xl font-bold text-black">{getStatusCount('pending')}</p>
          <p className="text-gray-800 text-sm">Pendientes</p>
        </div>
        <div className="bg-orange-600 rounded-lg p-4">
          <p className="text-2xl font-bold text-white">{getStatusCount('preparing')}</p>
          <p className="text-gray-200 text-sm">Preparando</p>
        </div>
        <div className="bg-green-600 rounded-lg p-4">
          <p className="text-2xl font-bold text-white">{getStatusCount('ready')}</p>
          <p className="text-gray-200 text-sm">Listos</p>
        </div>
        <div className="bg-blue-600 rounded-lg p-4">
          <p className="text-2xl font-bold text-white">{getStatusCount('confirmed')}</p>
          <p className="text-gray-200 text-sm">Confirmados</p>
        </div>
      </div>

      {/* Filtros y controles */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Filtro por estado */}
          <div>
            <label className="block text-gray-300 text-sm mb-2">Estado:</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded focus:outline-none focus:border-yellow-500"
            >
              <option value="">Todos los estados</option>
              <option value="pending">Pendiente</option>
              <option value="confirmed">Confirmado</option>
              <option value="preparing">Preparando</option>
              <option value="ready">Listo para Recoger</option>
              <option value="delivered">Recogido</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>

          {/* Búsqueda */}
          <div>
            <label className="block text-gray-300 text-sm mb-2">Buscar:</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Cliente, teléfono o ID"
              className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded focus:outline-none focus:border-yellow-500"
            />
          </div>

          {/* Ordenar */}
          <div>
            <label className="block text-gray-300 text-sm mb-2">Ordenar por:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded focus:outline-none focus:border-yellow-500"
            >
              <option value="newest">Más reciente</option>
              <option value="oldest">Más antiguo</option>
              <option value="amount_high">Mayor valor</option>
              <option value="amount_low">Menor valor</option>
            </select>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex space-x-3">
          <button
            onClick={loadOrders}
            className="px-4 py-2 bg-yellow-600 text-black rounded hover:bg-yellow-700 transition-colors"
            disabled={loading}
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

      {/* Lista de órdenes */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-white">
            Órdenes Para Recoger ({filteredOrders.length})
          </h3>
        </div>

        {error && (
          <div className="bg-red-600 text-white p-4 rounded-lg flex items-center gap-2">
            <span>❌</span>
            {error}
          </div>
        )}

        {filteredOrders.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-8 text-center border border-gray-700">
            <span className="text-6xl mb-4 block">🏪</span>
            <h3 className="text-xl font-semibold text-white mb-2">No hay órdenes para recoger</h3>
            <p className="text-gray-400">
              {orders.length === 0 
                ? 'No tienes órdenes para recoger en este momento.'
                : 'No hay órdenes que coincidan con los filtros aplicados.'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredOrders.map((order) => (
              <div key={order.order_id} className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">#{order.order_id}</h3>
                    <p className="text-gray-400 text-sm">
                      {formatTimeElapsed(order.created_at)} atrás
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm text-white ${
                      order.status === 'pending' ? 'bg-yellow-600' :
                      order.status === 'confirmed' ? 'bg-blue-600' :
                      order.status === 'preparing' ? 'bg-orange-600' :
                      order.status === 'ready' ? 'bg-green-600' :
                      order.status === 'delivered' ? 'bg-gray-600' : 'bg-red-600'
                    }`}>
                      {getStatusLabel(order.status)}
                    </span>
                    <span className="px-3 py-1 rounded-full text-sm bg-gray-700 text-white">
                      🏪 Para Recoger
                    </span>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="mb-4">
                  <p className="text-white font-semibold">{order.customer_name}</p>
                  <p className="text-gray-300 text-sm">{order.customer_phone}</p>
                  {order.customer_email && (
                    <p className="text-gray-300 text-sm">{order.customer_email}</p>
                  )}
                </div>

                {/* Products */}
                <div className="mb-4">
                  <p className="text-gray-400 text-sm mb-2">Productos ({order.products.length})</p>
                  <div className="space-y-1">
                    {order.products.map((product, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span className="text-gray-300">
                          {product.name} x{product.cantidad}
                        </span>
                        <span className="text-yellow-400 font-semibold">
                          {formatCurrency(product.precio * product.cantidad)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-700 mb-4">
                  <span className="text-lg font-bold text-white">Total</span>
                  <span className="text-2xl font-bold text-yellow-400">
                    {formatCurrency(order.total)}
                  </span>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  {order.status === 'pending' && (
                    <>
                      <button
                        onClick={() => updateOrderStatus(order.order_id, 'confirmed')}
                        className="w-full px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:opacity-80"
                      >
                        Confirmar
                      </button>
                      <button
                        onClick={() => updateOrderStatus(order.order_id, 'cancelled')}
                        className="w-full px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 text-white hover:opacity-80"
                      >
                        Cancelar
                      </button>
                    </>
                  )}
                  {order.status === 'confirmed' && (
                    <>
                      <button
                        onClick={() => updateOrderStatus(order.order_id, 'preparing')}
                        className="w-full px-4 py-2 rounded-lg text-sm font-semibold bg-orange-600 text-white hover:opacity-80"
                      >
                        Preparar
                      </button>
                      <button
                        onClick={() => updateOrderStatus(order.order_id, 'cancelled')}
                        className="w-full px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 text-white hover:opacity-80"
                      >
                        Cancelar
                      </button>
                    </>
                  )}
                  {order.status === 'preparing' && (
                    <>
                      <button
                        onClick={() => updateOrderStatus(order.order_id, 'ready')}
                        className="w-full px-4 py-2 rounded-lg text-sm font-semibold bg-green-600 text-white hover:opacity-80"
                      >
                        Marcar Listo para Recoger
                      </button>
                      <button
                        onClick={() => updateOrderStatus(order.order_id, 'cancelled')}
                        className="w-full px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 text-white hover:opacity-80"
                      >
                        Cancelar
                      </button>
                    </>
                  )}
                  {order.status === 'ready' && (
                    <button
                      onClick={() => updateOrderStatus(order.order_id, 'delivered')}
                      className="w-full px-4 py-2 rounded-lg text-sm font-semibold bg-gray-600 text-white hover:opacity-80"
                    >
                      Marcar como Recogido
                    </button>
                  )}
                  {(order.status === 'delivered' || order.status === 'cancelled') && (
                    <p className="text-gray-500 text-center py-4 text-sm">
                      No hay acciones disponibles
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 