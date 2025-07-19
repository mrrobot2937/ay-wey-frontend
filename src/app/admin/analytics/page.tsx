"use client";
import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@apollo/client';
import { GET_ORDERS_BY_RESTAURANT } from '../../../graphql/queries';
import { Order as GQLOrder, OrderStatus, DeliveryMethod, PaymentMethod } from '../../../types/graphql';
import config from '../../../../env.config.js';
import LoadingSpinner from '../../../components/LoadingSpinner'; // Importación corregida

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
  orders_by_payment: {
    [key: string]: number;
  };
  daily_revenue: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
  top_products: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [dateRange, setDateRange] = useState('7'); // días

  const { data, loading: queryLoading, error: queryError, refetch } = useQuery(GET_ORDERS_BY_RESTAURANT, {
      variables: { restaurantId: config.DEFAULT_RESTAURANT_ID },
      fetchPolicy: 'network-only',
  });

  const calculateAnalytics = useCallback((orders: GQLOrder[]): Analytics => {
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

    // Órdenes por tipo
    const ordersByType = orders.reduce((acc, order) => {
      acc[order.deliveryMethod] = (acc[order.deliveryMethod] || 0) + 1;
      return acc;
    }, {} as Record<DeliveryMethod, number>);

    // Órdenes por estado
    const ordersByStatus = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<OrderStatus, number>);

    // Órdenes por método de pago
    const ordersByPayment = orders.reduce((acc, order) => {
      acc[order.paymentMethod] = (acc[order.paymentMethod] || 0) + 1;
      return acc;
    }, {} as Record<PaymentMethod, number>);

    // Revenue diario
    const dailyRevenue = calculateDailyRevenue(orders);

    // Productos más vendidos
    const topProducts = calculateTopProducts(orders);

    return {
      total_orders: orders.length,
      total_revenue: totalRevenue,
      avg_order_value: avgOrderValue,
      orders_by_type: {
        DINE_IN: ordersByType.DINE_IN || 0,
        DELIVERY: ordersByType.DELIVERY || 0,
        PICKUP: ordersByType.PICKUP || 0
      },
      orders_by_status: ordersByStatus,
      orders_by_payment: ordersByPayment,
      daily_revenue: dailyRevenue,
      top_products: topProducts
    };
  }, []);

  useEffect(() => {
    if (data?.ordersByRestaurant) {
      const allOrders = data.ordersByRestaurant as GQLOrder[];
      const days = parseInt(dateRange);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      const filteredOrders = allOrders.filter(order => new Date(order.createdAt) >= cutoffDate);
      
      const calculatedAnalytics = calculateAnalytics(filteredOrders);
      setAnalytics(calculatedAnalytics);
    }
  }, [data, dateRange, calculateAnalytics]);

  const calculateDailyRevenue = (orders: GQLOrder[]) => {
    const dailyData = orders.reduce((acc, order) => {
      const date = new Date(order.createdAt).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { revenue: 0, orders: 0 };
      }
      acc[date].revenue += order.total;
      acc[date].orders += 1;
      return acc;
    }, {} as Record<string, { revenue: number; orders: number }>);

    return Object.entries(dailyData)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-7); // Últimos 7 días
  };

  const calculateTopProducts = (orders: GQLOrder[]) => {
    const productData = orders.reduce((acc, order) => {
      order.products.forEach(product => {
        if (!acc[product.name]) {
          acc[product.name] = { quantity: 0, revenue: 0 };
        }
        acc[product.name].quantity += product.quantity;
        acc[product.name].revenue += product.price * product.quantity;
      });
      return acc;
    }, {} as Record<string, { quantity: number; revenue: number }>);

    return Object.entries(productData)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10); // Top 10 productos
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusLabel = (status: OrderStatus) => {
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

  const getPaymentLabel = (method: PaymentMethod) => {
    const labels = {
      efectivo: 'Efectivo',
      tarjeta: 'Tarjeta',
      transferencia: 'Transferencia',
      nequi: 'Nequi',
      daviplata: 'Daviplata'
    };
    return labels[method as keyof typeof labels] || method;
  };

  if (queryLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <LoadingSpinner />
          <p className="text-gray-400">Cargando analytics...</p>
        </div>
      </div>
    );
  }

  if (queryError) {
    return (
      <div className="bg-red-600 text-white p-4 rounded-lg flex items-center gap-2">
        <span>❌</span>
        {queryError.message || 'Error cargando los datos de analytics'}
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 text-center border border-gray-700">
        <p className="text-gray-400">No hay datos de analytics disponibles para el período seleccionado.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Analytics del Restaurante</h1>
        <div className="flex items-center gap-4">
          <label className="text-gray-300 text-sm">Período:</label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded focus:outline-none focus:border-yellow-500"
          >
            <option value="1">Último día</option>
            <option value="7">Últimos 7 días</option>
            <option value="30">Últimos 30 días</option>
            <option value="90">Últimos 90 días</option>
          </select>
          <button
            onClick={refetch}
            className="px-4 py-2 bg-yellow-600 text-black rounded hover:bg-yellow-700 transition-colors"
          >
            🔄 Actualizar
          </button>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-blue-600 rounded-lg">
              <span className="text-2xl">📊</span>
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-white">{analytics.total_orders}</p>
              <p className="text-gray-400">Total Órdenes</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-green-600 rounded-lg">
              <span className="text-2xl">💰</span>
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-white">{formatCurrency(analytics.total_revenue)}</p>
              <p className="text-gray-400">Ingresos Totales</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-purple-600 rounded-lg">
              <span className="text-2xl">📈</span>
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-white">{formatCurrency(analytics.avg_order_value)}</p>
              <p className="text-gray-400">Promedio/Orden</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-orange-600 rounded-lg">
              <span className="text-2xl">📅</span>
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-white">{dateRange}</p>
              <p className="text-gray-400">Días Analizados</p>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos y estadísticas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Órdenes por tipo */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-yellow-400 mb-4">Órdenes por Tipo de Entrega</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">🪑 Mesa</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${(analytics.orders_by_type.DINE_IN / analytics.total_orders) * 100}%` }}
                  ></div>
                </div>
                <span className="text-white font-semibold">{analytics.orders_by_type.DINE_IN}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">🚚 Domicilio</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${(analytics.orders_by_type.DELIVERY / analytics.total_orders) * 100}%` }}
                  ></div>
                </div>
                <span className="text-white font-semibold">{analytics.orders_by_type.DELIVERY}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">🏪 Para Recoger</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full" 
                    style={{ width: `${(analytics.orders_by_type.PICKUP / analytics.total_orders) * 100}%` }}
                  ></div>
                </div>
                <span className="text-white font-semibold">{analytics.orders_by_type.PICKUP}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Órdenes por estado */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-yellow-400 mb-4">Órdenes por Estado</h3>
          <div className="space-y-3">
            {Object.entries(analytics.orders_by_status).map(([status, count]) => (
              <div key={status} className="flex justify-between items-center">
                <span className="text-gray-300">{getStatusLabel(status as OrderStatus)}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        status === 'pending' ? 'bg-yellow-600' :
                        status === 'confirmed' ? 'bg-blue-600' :
                        status === 'preparing' ? 'bg-orange-600' :
                        status === 'ready' ? 'bg-green-600' :
                        status === 'delivered' ? 'bg-gray-600' : 'bg-red-600'
                      }`}
                      style={{ width: `${(count / analytics.total_orders) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-white font-semibold">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Métodos de pago */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-yellow-400 mb-4">Métodos de Pago</h3>
          <div className="space-y-3">
            {Object.entries(analytics.orders_by_payment).map(([method, count]) => (
              <div key={method} className="flex justify-between items-center">
                <span className="text-gray-300">{getPaymentLabel(method as PaymentMethod)}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${(count / analytics.total_orders) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-white font-semibold">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Productos más vendidos */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-yellow-400 mb-4">Productos Más Vendidos</h3>
          <div className="space-y-3">
            {analytics.top_products.slice(0, 5).map((product, index) => (
              <div key={product.name} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-yellow-400 font-bold">#{index + 1}</span>
                  <span className="text-gray-300">{product.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-white font-semibold">{product.quantity} unidades</div>
                  <div className="text-gray-400 text-sm">{formatCurrency(product.revenue)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue diario */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-yellow-400 mb-4">Ingresos Diarios</h3>
        <div className="space-y-3">
          {analytics.daily_revenue.map((day) => (
            <div key={day.date} className="flex justify-between items-center">
              <span className="text-gray-300">
                {new Date(day.date).toLocaleDateString('es-CO', { 
                  weekday: 'long', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </span>
              <div className="text-right">
                <div className="text-white font-semibold">{formatCurrency(day.revenue)}</div>
                <div className="text-gray-400 text-sm">{day.orders} órdenes</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 