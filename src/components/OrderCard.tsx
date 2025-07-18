"use client";
import { useState } from 'react';

interface Order {
  id: string;
  customer: {
    name: string;
    phone: string;
    email: string;
  };
  total_amount: number;
  payment_method: string;
  delivery_method: string;
  delivery_address: string;
  mesa: string;
  status: string;
  status_label: string;
  delivery_type_label: string;
  created_at: string;
  updated_at: string;
  products: Array<{
    product_id: number;
    name: string;
    quantity: number;
    price: number;
    total: number;
    variant?: string;
    size?: string;
    label?: string;
  }>;
  time_elapsed: string;
}

interface OrderCardProps {
  order: Order;
  onOrderUpdate: () => void;
}

export default function OrderCard({ order, onOrderUpdate }: OrderCardProps) {
  const [updating, setUpdating] = useState(false);

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

  const getNextStatusOptions = (currentStatus: string) => {
    const flow = {
      pending: [
        { value: 'confirmed', label: 'Confirmar' },
        { value: 'cancelled', label: 'Cancelar' }
      ],
      confirmed: [
        { value: 'preparing', label: 'Preparar' },
        { value: 'cancelled', label: 'Cancelar' }
      ],
      preparing: [
        { value: 'ready', label: 'Marcar Listo' },
        { value: 'cancelled', label: 'Cancelar' }
      ],
      ready: [
        { value: 'delivered', label: 'Entregar' }
      ],
      delivered: [],
      cancelled: []
    };
    return flow[currentStatus as keyof typeof flow] || [];
  };

  const updateOrderStatus = async (newStatus: string) => {
    setUpdating(true);
    try {
      // Simular actualización
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log(`Actualizando orden ${order.id} a estado ${newStatus}`);
      // Aquí iría la llamada real a la API
      onOrderUpdate();
    } catch (error) {
      console.error('Error actualizando orden:', error);
      alert('Error actualizando la orden');
    } finally {
      setUpdating(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-CO', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-white">#{order.id}</h3>
          <p className="text-gray-400 text-sm">
            {formatTime(order.created_at)} • {order.time_elapsed}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm text-white ${getStatusColor(order.status)}`}>
            {order.status_label}
          </span>
          {order.delivery_method === 'mesa' && (
            <span className="px-3 py-1 rounded-full text-sm bg-gray-700 text-white">
              🪑 {order.mesa}
            </span>
          )}
        </div>
      </div>

      {/* Customer Info */}
      <div className="mb-4">
        <p className="text-white font-semibold">{order.customer.name}</p>
        <p className="text-gray-300 text-sm">{order.customer.phone}</p>
        {order.customer.email && (
          <p className="text-gray-300 text-sm">{order.customer.email}</p>
        )}
      </div>

      {/* Products */}
      <div className="mb-4">
        <p className="text-gray-400 text-sm mb-2">Productos ({order.products.length})</p>
        <div className="space-y-1">
          {order.products.map((product, index) => {
            // Detectar variante si existe
            const variant = product.variant || product.size || product.label;
            return (
              <div key={index} className="flex justify-between items-center text-sm">
                <span className="text-gray-300">
                  {product.name}
                  {variant ? (
                    <span className="ml-2 text-yellow-300 font-semibold">[{variant}]</span>
                  ) : null}
                  {' '}x{product.quantity}
                </span>
                <span className="text-yellow-400 font-semibold">
                  {formatCurrency(product.total)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment & Total */}
      <div className="mb-4 pt-4 border-t border-gray-700">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-400 text-sm">Método de pago</span>
          <span className="text-white text-sm">{order.payment_method}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold text-white">Total</span>
          <span className="text-2xl font-bold text-yellow-400">
            {formatCurrency(order.total_amount)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        {getNextStatusOptions(order.status).map((action) => (
          <button
            key={action.value}
            onClick={() => updateOrderStatus(action.value)}
            disabled={updating}
            className={`w-full px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${getStatusColor(action.value)} text-white hover:opacity-80 disabled:opacity-50`}
          >
            {updating ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Actualizando...
              </div>
            ) : (
              action.label
            )}
          </button>
        ))}
        {getNextStatusOptions(order.status).length === 0 && (
          <p className="text-gray-500 text-center py-4 text-sm">
            No hay acciones disponibles
          </p>
        )}
      </div>
    </div>
  );
} 