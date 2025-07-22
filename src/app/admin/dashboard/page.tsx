"use client";
import { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { GET_ORDERS_BY_RESTAURANT } from '../../../graphql/queries';
import { Order as GQLOrder, DeliveryMethod } from '../../../types/graphql';
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
  const [period, setPeriod] = useState<'today' | 'month' | 'total'>('today');
  const { data, loading, error } = useQuery(GET_ORDERS_BY_RESTAURANT, {
      variables: { restaurantId: config.DEFAULT_RESTAURANT_ID },
      fetchPolicy: 'network-only',
      pollInterval: 15000,
  });
  console.log('DASHBOARD useQuery data:', data);
  console.log('DASHBOARD useQuery error:', error);
  if (data) {
    console.log('DASHBOARD data keys:', Object.keys(data));
    console.log('DASHBOARD data full:', data);
  }
      
  // Calcular analytics y filtrar órdenes cuando los datos de GraphQL cambian
  useEffect(() => {
    if (data?.orders) {
      console.log('ORDENES DASHBOARD:', data.orders);
      const allOrders: GQLOrder[] = data.orders;
      // Filtrar por periodo
      const now = new Date();
      let filteredOrders = allOrders;
      if (period === 'today') {
        filteredOrders = filteredOrders.filter(order => {
          const created = new Date(order.createdAt);
          return created.getDate() === now.getDate() && created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
        });
      } else if (period === 'month') {
        filteredOrders = filteredOrders.filter(order => {
          const created = new Date(order.createdAt);
          return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
        });
      }
      // Calcular analytics
      const totalRevenue = filteredOrders.reduce((sum: number, order: GQLOrder) => sum + (order.total || 0), 0);
      const avgOrderValue = filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0;
      const ordersByTypeCount = filteredOrders.reduce((acc: Record<DeliveryMethod, number>, order: GQLOrder) => {
        acc[order.deliveryMethod] = (acc[order.deliveryMethod] || 0) + 1;
        return acc;
      }, {} as Record<DeliveryMethod, number>);
      const ordersByStatusCount = filteredOrders.reduce((acc: Record<string, number>, order: GQLOrder) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      setAnalytics({
        total_orders: filteredOrders.length,
        total_revenue: totalRevenue,
        avg_order_value: avgOrderValue,
        orders_by_type: {
          DINE_IN: ordersByTypeCount.DINE_IN || 0,
          DELIVERY: ordersByTypeCount.DELIVERY || 0,
          PICKUP: ordersByTypeCount.PICKUP || 0
        },
        orders_by_status: ordersByStatusCount,
        period_days: period === 'today' ? 1 : period === 'month' ? 30 : 365
      });
      // Filtrar órdenes por tipo (todas para las listas)
      setOrdersByType({
        dine_in: allOrders.filter(o => o.deliveryMethod === 'DINE_IN'),
        delivery: allOrders.filter(o => o.deliveryMethod === 'DELIVERY'),
        pickup: allOrders.filter(o => o.deliveryMethod === 'PICKUP'),
      });
    } else {
      setAnalytics({
        total_orders: 0,
        total_revenue: 0,
        avg_order_value: 0,
        orders_by_type: { DINE_IN: 0, DELIVERY: 0, PICKUP: 0 },
        orders_by_status: {},
        period_days: period === 'today' ? 1 : period === 'month' ? 30 : 365
      });
    }
  }, [data, period]);

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="bg-red-100 text-red-700 p-4 rounded-lg text-center font-bold">Error en la consulta de órdenes: {error.message}</div>;
  if (!data || !data.orders || !Array.isArray(data.orders) || data.orders.length === 0) {
    return <div className="bg-yellow-100 text-yellow-700 p-4 rounded-lg text-center font-bold">No se encontraron órdenes para mostrar. Revisa la configuración de la API o la base de datos.</div>;
  }

  // Eliminar handleNewOrdersAcknowledged y toggleNotifications

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const totalActiveOrders = ordersByType.dine_in.length + ordersByType.delivery.length + ordersByType.pickup.length;

  return (
    <div className="space-y-6">
      {/* Cards de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Filtros de periodo para ingresos */}
        <div className="col-span-1 md:col-span-2 lg:col-span-4 flex justify-center mb-2 gap-2">
          <button onClick={() => setPeriod('today')} className={`px-3 py-1 rounded-full text-sm font-bold border ${period==='today' ? 'bg-yellow-400 text-black border-yellow-500' : 'bg-white text-gray-700 border-gray-300'}`}>Hoy</button>
          <button onClick={() => setPeriod('month')} className={`px-3 py-1 rounded-full text-sm font-bold border ${period==='month' ? 'bg-yellow-400 text-black border-yellow-500' : 'bg-white text-gray-700 border-gray-300'}`}>Este mes</button>
          <button onClick={() => setPeriod('total')} className={`px-3 py-1 rounded-full text-sm font-bold border ${period==='total' ? 'bg-yellow-400 text-black border-yellow-500' : 'bg-white text-gray-700 border-gray-300'}`}>Total</button>
        </div>
        {/* Órdenes activas */}
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-400 rounded-lg">
              <span className="text-2xl">📋</span>
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{totalActiveOrders}</p>
              <p className="text-gray-500">Órdenes Activas</p>
            </div>
          </div>
        </div>
        {/* Revenue total */}
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-green-400 rounded-lg">
              <span className="text-2xl">💰</span>
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">
                {analytics ? formatCurrency(analytics.total_revenue) : formatCurrency(0)}
              </p>
              <p className="text-gray-500">Ingresos {period === 'today' ? 'de Hoy' : period === 'month' ? 'del Mes' : 'Totales'}</p>
            </div>
          </div>
        </div>
        {/* Promedio por orden */}
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-blue-400 rounded-lg">
              <span className="text-2xl">📊</span>
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">
                {analytics ? formatCurrency(analytics.avg_order_value) : formatCurrency(0)}
              </p>
              <p className="text-gray-500">Promedio/Orden</p>
            </div>
          </div>
        </div>
        {/* Total órdenes */}
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-purple-400 rounded-lg">
              <span className="text-2xl">🎯</span>
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">
                {analytics ? analytics.total_orders : 0}
              </p>
              <p className="text-gray-500">Total Órdenes</p>
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

      {/* Eliminar sección de órdenes por tipo (mesas, domicilio, recoger) */}

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