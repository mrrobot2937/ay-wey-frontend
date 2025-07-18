"use client";
import { useState, useEffect, useCallback } from 'react';
import { apiService, Order } from '../../../../services/api-service';

export default function DomicilioOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [restaurantId, setRestaurantId] = useState('ay-wey');
  const [filters, setFilters] = useState({
    status: '',
    address: '',
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

      // Cargar órdenes de domicilio
      const response = await apiService.getOrders('ay-wey');
      const domicilioOrders = response.orders.filter(order => order.restaurant_id === 'ay-wey' && order.delivery_method === 'domicilio');
      setOrders(domicilioOrders);
      
    } catch (error) {
      console.error('Error cargando órdenes:', error);
      setError('Error cargando las órdenes de domicilio');
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  const applyFilters = useCallback(() => {
    let filtered = [...orders];

    // Filtrar por estado
    if (filters.status) {
      filtered = filtered.filter(order => order.status === filters.status);
    }

    // Filtrar por dirección
    if (filters.address) {
      filtered = filtered.filter(order => 
        order.direccion && order.direccion.toLowerCase().includes(filters.address.toLowerCase())
      );
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
      address: '',
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
      ready: 'En Camino',
      delivered: 'Entregados',
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
          <p className="text-gray-400">Cargando órdenes de domicilio...</p>
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
          <p className="text-gray-400 text-sm">Total Domicilios</p>
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
          <p className="text-gray-200 text-sm">En Camino</p>
        </div>
        <div className="bg-blue-600 rounded-lg p-4">
          <p className="text-2xl font-bold text-white">{getStatusCount('confirmed')}</p>
          <p className="text-gray-200 text-sm">Confirmados</p>
        </div>
      </div>

      {/* Filtros y controles */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
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
              <option value="ready">En Camino</option>
              <option value="delivered">Entregado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>

          {/* Filtro por dirección */}
          <div>
            <label className="block text-gray-300 text-sm mb-2">Dirección:</label>
            <input
              type="text"
              value={filters.address}
              onChange={(e) => handleFilterChange('address', e.target.value)}
              placeholder="Buscar por dirección..."
              className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded focus:outline-none focus:border-yellow-500"
            />
          </div>

          {/* Búsqueda */}
          <div>
            <label className="block text-gray-300 text-sm mb-2">Buscar:</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Cliente, teléfono, #orden..."
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
              <option value="newest">Más recientes</option>
              <option value="oldest">Más antiguos</option>
              <option value="amount_high">Mayor monto</option>
              <option value="amount_low">Menor monto</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            Limpiar filtros
          </button>
          <button
            onClick={loadOrders}
            className="px-4 py-2 bg-yellow-600 text-black rounded hover:bg-yellow-700 transition-colors"
          >
            🔄 Actualizar
          </button>
        </div>
      </div>

      {/* Lista de órdenes */}
      {error && (
        <div className="bg-red-600 text-white p-4 rounded-lg">
          {error}
        </div>
      )}

      {filteredOrders.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🚚</div>
          <h3 className="text-2xl font-bold mb-2">No hay órdenes de domicilio</h3>
          <p className="text-gray-400">
            {filters.status || filters.address || filters.search 
              ? 'No se encontraron órdenes que coincidan con los filtros'
              : 'No hay órdenes de domicilio disponibles'
            }
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredOrders.map((order) => (
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
                      <span className={`px-3 py-1 rounded-full text-sm text-white ${
                        order.status === 'pending' ? 'bg-yellow-600' :
                        order.status === 'confirmed' ? 'bg-blue-600' :
                        order.status === 'preparing' ? 'bg-orange-600' :
                        order.status === 'ready' ? 'bg-green-600' :
                        order.status === 'delivered' ? 'bg-gray-600' :
                        'bg-red-600'
                      }`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </div>
                  </div>

                  {/* Información del cliente */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-gray-400 text-sm">Cliente:</p>
                      <p className="text-white font-medium">{order.customer_name}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Teléfono:</p>
                      <p className="text-white">{order.customer_phone}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-gray-400 text-sm">Dirección:</p>
                      <p className="text-white">{order.direccion || 'No especificada'}</p>
                    </div>
                  </div>

                  {/* Productos */}
                  <div className="mb-4">
                    <p className="text-gray-400 text-sm mb-2">Productos:</p>
                    <div className="space-y-2">
                      {order.products.map((product, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <span className="text-white">{product.cantidad}x {product.name}</span>
                          <span className="text-yellow-400">{formatCurrency(product.precio * product.cantidad)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Total */}
                  <div className="border-t border-gray-600 pt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-white">Total:</span>
                      <span className="text-xl font-bold text-yellow-400">{formatCurrency(order.total)}</span>
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                <div className="lg:w-48">
                  <div className="space-y-2">
                    {order.status === 'pending' && (
                      <>
                        <button
                          onClick={() => updateOrderStatus(order.order_id, 'confirmed')}
                          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                          ✓ Confirmar
                        </button>
                        <button
                          onClick={() => updateOrderStatus(order.order_id, 'cancelled')}
                          className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                        >
                          ✗ Cancelar
                        </button>
                      </>
                    )}
                    
                    {order.status === 'confirmed' && (
                      <>
                        <button
                          onClick={() => updateOrderStatus(order.order_id, 'preparing')}
                          className="w-full px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
                        >
                          👨‍🍳 Preparar
                        </button>
                        <button
                          onClick={() => updateOrderStatus(order.order_id, 'cancelled')}
                          className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                        >
                          ✗ Cancelar
                        </button>
                      </>
                    )}
                    
                    {order.status === 'preparing' && (
                      <button
                        onClick={() => updateOrderStatus(order.order_id, 'ready')}
                        className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                      >
                        🚚 En Camino
                      </button>
                    )}
                    
                    {order.status === 'ready' && (
                      <button
                        onClick={() => updateOrderStatus(order.order_id, 'delivered')}
                        className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                      >
                        ✅ Entregado
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 