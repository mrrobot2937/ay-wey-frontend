"use client";
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { apiService, Order } from '../../../services/api-service';
import { useOrderNotifications } from '../../../hooks/useOrderNotifications';

interface OrdersByType {
  mesa: Order[];
  domicilio: Order[];
  recoger: Order[];
}

interface Analytics {
  total_orders: number;
  total_revenue: number;
  avg_order_value: number;
  orders_by_type: {
    mesa: number;
    domicilio: number;
    recoger: number;
  };
  orders_by_status: {
    [key: string]: number;
  };
  period_days: number;
}

export default function AdminDashboard() {
  const [ordersByType, setOrdersByType] = useState<OrdersByType>({
    mesa: [],
    domicilio: [],
    recoger: []
  });
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [restaurantId, setRestaurantId] = useState('ay-wey');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Hook para notificaciones automáticas de nuevos pedidos
  const { 
    newOrdersCount, 
    isPlaying, 
    stopAlarm, 
    lastCheckTime, 
    resetNewOrdersCount 
  } = useOrderNotifications(restaurantId, 15000, notificationsEnabled);

  const loadDashboardData = useCallback(async () => {
    console.log('🏠 DASHBOARD: ===== INICIANDO CARGA DASHBOARD =====');
    
    try {
      setLoading(true);
      setError('');
      
      const timestamp = new Date().toISOString();
      console.log(`🏠 DASHBOARD: [${timestamp}] Cargando datos del dashboard...`, { restaurantId });
      
      // Obtener datos del usuario admin
      const adminData = localStorage.getItem('admin_user');
      let currentRestaurantId = restaurantId;
      
      if (adminData) {
        const userData = JSON.parse(adminData);
        let storedRestaurantId = userData.restaurant_id || 'ay-wey';
        
        // ARREGLO: Si el ID almacenado tiene el prefijo "rest_", quitarlo
        if (storedRestaurantId.startsWith('rest_')) {
          storedRestaurantId = storedRestaurantId.replace('rest_', '');
          console.log(`🔧 DASHBOARD: [${timestamp}] Removiendo prefijo "rest_": ${userData.restaurant_id} → ${storedRestaurantId}`);
        }
        
        currentRestaurantId = storedRestaurantId;
        console.log(`👤 DASHBOARD: [${timestamp}] Usuario admin:`, userData);
        console.log(`🏪 DASHBOARD: [${timestamp}] Restaurant ID: ${restaurantId} → ${currentRestaurantId}`);
        setRestaurantId(currentRestaurantId);
      }

      // Obtener TODAS las órdenes con datos frescos
      console.log(`📡 DASHBOARD: [${timestamp}] Solicitando TODAS las órdenes con forceRefresh...`);
      const allOrdersResponse = await apiService.getOrders(currentRestaurantId, undefined, undefined, true);
      console.log(`📦 DASHBOARD: [${timestamp}] Respuesta API:`, {
        success: allOrdersResponse.success,
        total_count: allOrdersResponse.total_count,
        orders_length: allOrdersResponse.orders ? allOrdersResponse.orders.length : 0
      });
      
      if (!allOrdersResponse.orders || !Array.isArray(allOrdersResponse.orders)) {
        throw new Error('Respuesta inválida de API - no hay array de órdenes');
      }
      
      const allOrders = allOrdersResponse.orders;
      console.log(`📋 DASHBOARD: [${timestamp}] Total órdenes:`, allOrders.length);

      // Filtrar órdenes por tipo de entrega
      const mesaOrders = allOrders.filter(order => order.delivery_method === 'mesa');
      const domicilioOrders = allOrders.filter(order => order.delivery_method === 'domicilio');
      const recogerOrders = allOrders.filter(order => order.delivery_method === 'recoger');
      
      console.log(`🪑 DASHBOARD: [${timestamp}] Órdenes mesa:`, mesaOrders.length);
      console.log(`🚚 DASHBOARD: [${timestamp}] Órdenes domicilio:`, domicilioOrders.length);
      console.log(`🥡 DASHBOARD: [${timestamp}] Órdenes recoger:`, recogerOrders.length);

      // Calcular analytics
      const totalRevenue = allOrders.reduce((sum, order) => sum + order.total, 0);
      const avgOrderValue = allOrders.length > 0 ? totalRevenue / allOrders.length : 0;
      
      console.log(`💰 DASHBOARD: [${timestamp}] Revenue total:`, totalRevenue);
      console.log(`📊 DASHBOARD: [${timestamp}] Promedio por orden:`, avgOrderValue);
      
      const ordersByTypeCount = allOrders.reduce((acc, order) => {
        acc[order.delivery_method] = (acc[order.delivery_method] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const ordersByStatusCount = allOrders.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      console.log(`📈 DASHBOARD: [${timestamp}] Por tipo:`, ordersByTypeCount);
      console.log(`📈 DASHBOARD: [${timestamp}] Por estado:`, ordersByStatusCount);

      const calculatedAnalytics: Analytics = {
        total_orders: allOrders.length,
        total_revenue: totalRevenue,
        avg_order_value: avgOrderValue,
        orders_by_type: {
          mesa: ordersByTypeCount.mesa || 0,
          domicilio: ordersByTypeCount.domicilio || 0,
          recoger: ordersByTypeCount.recoger || 0
        },
        orders_by_status: ordersByStatusCount,
        period_days: 7
      };

      // Actualizar estado
      console.log(`💾 DASHBOARD: [${timestamp}] Actualizando estado...`);
      setOrdersByType({
        mesa: mesaOrders,
        domicilio: domicilioOrders,
        recoger: recogerOrders
      });
      setAnalytics(calculatedAnalytics);
      
      console.log(`✅ DASHBOARD: [${timestamp}] Estado actualizado exitosamente`);
      
    } catch (error) {
      const timestamp = new Date().toISOString();
      console.error(`❌ DASHBOARD: [${timestamp}] Error cargando dashboard:`, error);
      setError(`Error cargando datos del dashboard: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
      const timestamp = new Date().toISOString();
      console.log(`🏁 DASHBOARD: [${timestamp}] ===== CARGA COMPLETADA =====`);
    }
  }, [restaurantId]);

  // Cargar datos del dashboard
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleNewOrdersAcknowledged = () => {
    resetNewOrdersCount();
    if (isPlaying) {
      stopAlarm();
    }
  };

  const toggleNotifications = () => {
    setNotificationsEnabled(!notificationsEnabled);
    if (isPlaying) {
      stopAlarm();
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  const totalActiveOrders = ordersByType.mesa.length + ordersByType.domicilio.length + ordersByType.recoger.length;

  return (
    <div className="space-y-6">
      {/* Panel de Notificaciones */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <span className="text-lg">🔔</span>
              <span className="ml-2 text-white font-semibold">Notificaciones Automáticas</span>
              <div className={`ml-2 w-3 h-3 rounded-full ${notificationsEnabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
            </div>
            
            {newOrdersCount > 0 && (
              <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                isPlaying ? 'bg-red-600 text-white animate-pulse' : 'bg-yellow-600 text-black'
              }`}>
                {newOrdersCount} nuevo{newOrdersCount > 1 ? 's' : ''} pedido{newOrdersCount > 1 ? 's' : ''}
              </div>
            )}

            {lastCheckTime && (
              <span className="text-gray-400 text-sm">
                Última verificación: {lastCheckTime.toLocaleTimeString()}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {isPlaying && (
              <button
                onClick={stopAlarm}
                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
              >
                🔇 Silenciar
              </button>
            )}
            
            {newOrdersCount > 0 && (
              <button
                onClick={handleNewOrdersAcknowledged}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
              >
                ✅ Visto
              </button>
            )}

            <button
              onClick={toggleNotifications}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                notificationsEnabled 
                  ? 'bg-yellow-600 text-black hover:bg-yellow-700' 
                  : 'bg-gray-600 text-white hover:bg-gray-500'
              }`}
            >
              {notificationsEnabled ? '🔔 Activadas' : '🔕 Desactivadas'}
            </button>
            
            <button
              onClick={loadDashboardData}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
              disabled={loading}
            >
              🔄 Actualizar
            </button>
            
            <button
              onClick={async () => {
                try {
                  console.log('🔄 Recargando datos sin cache...');
                  // Recargar simplemente sin intentar limpiar cache
                  await loadDashboardData();
                } catch (error) {
                  console.error('Error recargando datos:', error);
                }
              }}
              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
              disabled={loading}
            >
              ♻️ Recargar
            </button>
            
            <button
              onClick={async () => {
                try {
                  console.log('🔍 Ejecutando diagnóstico...');
                  const result = await apiService.testConnection();
                  console.log('📊 Resultado diagnóstico:', result);
                  alert(`Diagnóstico: ${result.service} - ${result.status}\nDetalles: ${JSON.stringify(result.details, null, 2)}`);
                } catch (error) {
                  console.error('Error en diagnóstico:', error);
                  alert(`Error en diagnóstico: ${error instanceof Error ? error.message : 'Error desconocido'}`);
                }
              }}
              className="px-3 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700 transition-colors"
              disabled={loading}
            >
              🔍 Diagnóstico
            </button>
          </div>
        </div>
        
        <p className="text-gray-400 text-sm mt-2">
          El sistema verifica nuevos pedidos cada 15 segundos y reproduce una alarma cuando detecta pedidos nuevos.
        </p>
      </div>

      {/* Cards de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Órdenes activas */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-600 rounded-lg">
              <span className="text-2xl">📋</span>
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-white">{totalActiveOrders}</p>
              <p className="text-gray-400">Órdenes Activas</p>
            </div>
          </div>
        </div>

        {/* Revenue total */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-green-600 rounded-lg">
              <span className="text-2xl">💰</span>
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-white">
                {analytics ? formatCurrency(analytics.total_revenue) : formatCurrency(0)}
              </p>
              <p className="text-gray-400">Ingresos Totales</p>
            </div>
          </div>
        </div>

        {/* Promedio por orden */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-blue-600 rounded-lg">
              <span className="text-2xl">📊</span>
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-white">
                {analytics ? formatCurrency(analytics.avg_order_value) : formatCurrency(0)}
              </p>
              <p className="text-gray-400">Promedio/Orden</p>
            </div>
          </div>
        </div>

        {/* Total órdenes */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-purple-600 rounded-lg">
              <span className="text-2xl">🎯</span>
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-white">
                {analytics ? analytics.total_orders : 0}
              </p>
              <p className="text-gray-400">Total Órdenes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Información del restaurante */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-yellow-400 mb-4">Información del Restaurante</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">Ay Wey</p>
            <p className="text-gray-400">Restaurante</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white">
              {analytics ? analytics.orders_by_type.mesa + analytics.orders_by_type.domicilio + analytics.orders_by_type.recoger : 0}
            </p>
            <p className="text-gray-400">Órdenes por Tipo</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white">
              {analytics ? Object.keys(analytics.orders_by_status).length : 0}
            </p>
            <p className="text-gray-400">Estados Diferentes</p>
          </div>
        </div>
      </div>

      {/* Órdenes por tipo de entrega */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Órdenes de Mesa */}
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-yellow-400 flex items-center">
                <span className="mr-2">🪑</span>
                Mesas ({ordersByType.mesa.length})
              </h3>
              <Link
                href="/admin/orders/mesa"
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                Ver todas →
              </Link>
            </div>
          </div>
          <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
            {ordersByType.mesa.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No hay órdenes de mesa</p>
            ) : (
              ordersByType.mesa.slice(0, 5).map((order) => (
                <div key={order.order_id} className="bg-gray-700 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-white">{order.customer_name}</p>
                      <p className="text-sm text-gray-400">Mesa: {order.mesa || 'N/A'}</p>
                      <p className="text-xs text-gray-500">#{order.order_id}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs text-white ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-yellow-400 font-bold">{formatCurrency(order.total)}</span>
                    <span className="text-xs text-gray-400">{formatTimeElapsed(order.created_at)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Órdenes de Domicilio */}
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-yellow-400 flex items-center">
                <span className="mr-2">🚚</span>
                Domicilios ({ordersByType.domicilio.length})
              </h3>
              <Link
                href="/admin/orders/domicilio"
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                Ver todas →
              </Link>
            </div>
          </div>
          <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
            {ordersByType.domicilio.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No hay domicilios</p>
            ) : (
              ordersByType.domicilio.slice(0, 5).map((order) => (
                <div key={order.order_id} className="bg-gray-700 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-white">{order.customer_name}</p>
                      <p className="text-sm text-gray-400 truncate">{order.direccion || 'Sin dirección'}</p>
                      <p className="text-xs text-gray-500">#{order.order_id}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs text-white ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-yellow-400 font-bold">{formatCurrency(order.total)}</span>
                    <span className="text-xs text-gray-400">{formatTimeElapsed(order.created_at)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Órdenes para Recoger */}
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-yellow-400 flex items-center">
                <span className="mr-2">🏪</span>
                Para Recoger ({ordersByType.recoger.length})
              </h3>
              <Link
                href="/admin/orders/recoger"
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                Ver todas →
              </Link>
            </div>
          </div>
          <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
            {ordersByType.recoger.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No hay órdenes para recoger</p>
            ) : (
              ordersByType.recoger.slice(0, 5).map((order) => (
                <div key={order.order_id} className="bg-gray-700 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-white">{order.customer_name}</p>
                      <p className="text-sm text-gray-400">{order.customer_phone}</p>
                      <p className="text-xs text-gray-500">#{order.order_id}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs text-white ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-yellow-400 font-bold">{formatCurrency(order.total)}</span>
                    <span className="text-xs text-gray-400">{formatTimeElapsed(order.created_at)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Botón de refrescar */}
      <div className="flex justify-center">
        <button
          onClick={loadDashboardData}
          className="px-6 py-2 bg-yellow-600 text-black rounded-lg hover:bg-yellow-700 transition-colors flex items-center gap-2"
          disabled={loading}
        >
          <span className={loading ? 'animate-spin' : ''}>🔄</span>
          {loading ? 'Actualizando...' : 'Actualizar Dashboard'}
        </button>
      </div>

      {error && (
        <div className="bg-red-600 text-white p-4 rounded-lg flex items-center gap-2">
          <span>❌</span>
          {error}
        </div>
      )}
    </div>
  );
} 