"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useQuery } from '@apollo/client';
import { GET_ORDERS_BY_RESTAURANT } from '../../../graphql/queries';
import { Order as GQLOrder, DeliveryMethod } from '../../../types/graphql';
import { useOrderNotifications } from '../../../hooks/useOrderNotifications';
import config from '../../../../env.config.js';
import LoadingSpinner from '../../../components/LoadingSpinner';

interface OrdersByType {
  dine_in: GQLOrder[];
  delivery: GQLOrder[];
  pickup: GQLOrder[];
}

interface Analytics {
  total_orders: number;
  total_revenue: number;
  avg_order_value: number;
  orders_by_type: {
    DINE_IN: number;
    DELIVERY: number;
    PICKUP: number;
  };
  orders_by_status: {
    [key: string]: number;
  };
  period_days: number;
}

export default function AdminDashboard() {
  const [ordersByType, setOrdersByType] = useState<OrdersByType>({ dine_in: [], delivery: [], pickup: [] });
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const { data, loading, error } = useQuery(GET_ORDERS_BY_RESTAURANT, {
      variables: { restaurantId: config.DEFAULT_RESTAURANT_ID },
      fetchPolicy: 'network-only',
      pollInterval: 15000,
  });

  // Lógica de notificaciones
  const { newOrdersCount, isPlaying, stopAlarm, lastCheckTime, resetNewOrdersCount } = useOrderNotifications(config.DEFAULT_RESTAURANT_ID, 15000);
      
  // Calcular analytics y filtrar órdenes cuando los datos de GraphQL cambian
  useEffect(() => {
    if (data?.ordersByRestaurant) {
      const allOrders: GQLOrder[] = data.ordersByRestaurant;

      // Calcular analytics
      const totalRevenue = allOrders.reduce((sum: number, order: GQLOrder) => sum + order.total, 0);
      const avgOrderValue = allOrders.length > 0 ? totalRevenue / allOrders.length : 0;
      
      const ordersByTypeCount = allOrders.reduce((acc: Record<DeliveryMethod, number>, order: GQLOrder) => {
        acc[order.deliveryMethod] = (acc[order.deliveryMethod] || 0) + 1;
        return acc;
      }, {} as Record<DeliveryMethod, number>);

      const ordersByStatusCount = allOrders.reduce((acc: Record<string, number>, order: GQLOrder) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      setAnalytics({
        total_orders: allOrders.length,
        total_revenue: totalRevenue,
        avg_order_value: avgOrderValue,
        orders_by_type: {
          DINE_IN: ordersByTypeCount.DINE_IN || 0,
          DELIVERY: ordersByTypeCount.DELIVERY || 0,
          PICKUP: ordersByTypeCount.PICKUP || 0
        },
        orders_by_status: ordersByStatusCount,
        period_days: 7
      });

      // Filtrar órdenes
      setOrdersByType({
        dine_in: allOrders.filter(o => o.deliveryMethod === 'DINE_IN'),
        delivery: allOrders.filter(o => o.deliveryMethod === 'DELIVERY'),
        pickup: allOrders.filter(o => o.deliveryMethod === 'PICKUP'),
      });
    }
  }, [data]);

  if (loading) return <LoadingSpinner />;
  if (error) return <p>Error: {error.message}</p>;

  const handleNewOrdersAcknowledged = () => {
    resetNewOrdersCount();
    if (isPlaying) {
      stopAlarm();
    }
  };

  const toggleNotifications = () => {
    // This state is no longer managed by useOrderNotifications, so this function is no longer needed.
    // Keeping it for now as it might be re-introduced or removed later.
    // setNotificationsEnabled(!notificationsEnabled); 
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

  const totalActiveOrders = ordersByType.dine_in.length + ordersByType.delivery.length + ordersByType.pickup.length;

  return (
    <div className="space-y-6">
      {/* Panel de Notificaciones */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <span className="text-lg">🔔</span>
              <span className="ml-2 text-white font-semibold">Notificaciones Automáticas</span>
              <div className={`ml-2 w-3 h-3 rounded-full ${newOrdersCount > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
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
                newOrdersCount > 0 
                  ? 'bg-yellow-600 text-black hover:bg-yellow-700' 
                  : 'bg-gray-600 text-white hover:bg-gray-500'
              }`}
            >
              {newOrdersCount > 0 ? '🔔 Activadas' : '🔕 Desactivadas'}
            </button>
            
            {/* The "Actualizar" and "Recargar" buttons are removed as they are no longer needed */}
            
            <button
              onClick={async () => {
                try {
                  console.log('🔍 Ejecutando diagnóstico...');
                  alert('Diagnóstico: Servicio no disponible en esta versión.');
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
              {analytics ? analytics.orders_by_type.DINE_IN + analytics.orders_by_type.DELIVERY + analytics.orders_by_type.PICKUP : 0}
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
                Mesas ({ordersByType.dine_in.length})
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
            {ordersByType.dine_in.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No hay órdenes de mesa</p>
            ) : (
              ordersByType.dine_in.slice(0, 5).map((order) => (
                <div key={order.id} className="bg-gray-700 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-white">{order.customer.name}</p>
                      <p className="text-sm text-gray-400">Mesa: {order.mesa || 'N/A'}</p>
                      <p className="text-xs text-gray-500">#{order.id}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs text-white ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-yellow-400 font-bold">{formatCurrency(order.total)}</span>
                    <span className="text-xs text-gray-400">{formatTimeElapsed(order.createdAt)}</span>
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
                Domicilios ({ordersByType.delivery.length})
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
            {ordersByType.delivery.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No hay domicilios</p>
            ) : (
              ordersByType.delivery.slice(0, 5).map((order) => (
                <div key={order.id} className="bg-gray-700 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-white">{order.customer.name}</p>
                      <p className="text-sm text-gray-400 truncate">{order.deliveryAddress || 'Sin dirección'}</p>
                      <p className="text-xs text-gray-500">#{order.id}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs text-white ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-yellow-400 font-bold">{formatCurrency(order.total)}</span>
                    <span className="text-xs text-gray-400">{formatTimeElapsed(order.createdAt)}</span>
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
                Para Recoger ({ordersByType.pickup.length})
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
            {ordersByType.pickup.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No hay órdenes para recoger</p>
            ) : (
              ordersByType.pickup.slice(0, 5).map((order) => (
                <div key={order.id} className="bg-gray-700 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-white">{order.customer.name}</p>
                      <p className="text-sm text-gray-400">{order.customer.phone}</p>
                      <p className="text-xs text-gray-500">#{order.id}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs text-white ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-yellow-400 font-bold">{formatCurrency(order.total)}</span>
                    <span className="text-xs text-gray-400">{formatTimeElapsed(order.createdAt)}</span>
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
          onClick={() => {
            // Re-fetch data to update the dashboard
            // This button is no longer needed as data is fetched on mount
          }}
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
          {String(error)}
        </div>
      )}
    </div>
  );
} 