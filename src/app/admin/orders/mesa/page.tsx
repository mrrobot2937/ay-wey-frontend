"use client";
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_ORDERS_BY_RESTAURANT, UPDATE_ORDER_STATUS } from '../../../../graphql/queries';
import { Order as GQLOrder, OrderStatus } from '../../../../types/graphql';
import LoadingSpinner from '../../../../components/LoadingSpinner';
import config from '../../../../../env.config.js';

// Componente principal de la página
export default function MesaOrdersPage() {
    const [orders, setOrders] = useState<GQLOrder[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<GQLOrder[]>([]);
    const [filters, setFilters] = useState({ status: '', mesa: '', search: '' });

    const { loading, error, data } = useQuery(GET_ORDERS_BY_RESTAURANT, {
        variables: { restaurantId: config.DEFAULT_RESTAURANT_ID },
        fetchPolicy: 'network-only',
        pollInterval: 10000, // Refrescar cada 10 segundos
    });

    const [updateOrderStatusMutation] = useMutation(UPDATE_ORDER_STATUS, {
        refetchQueries: [{ query: GET_ORDERS_BY_RESTAURANT, variables: { restaurantId: config.DEFAULT_RESTAURANT_ID } }]
    });

    useEffect(() => {
        if (data?.ordersByRestaurant) {
            const mesaOrders = data.ordersByRestaurant.filter((o: GQLOrder) => o.deliveryMethod === 'DINE_IN');
            setOrders(mesaOrders);
        }
    }, [data]);

    const applyFilters = useCallback(() => {
        let processedOrders = [...orders];
        if (filters.status) {
            processedOrders = processedOrders.filter(o => o.status === filters.status);
        }
        if (filters.mesa) {
            processedOrders = processedOrders.filter(o => o.mesa?.toString() === filters.mesa);
        }
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            processedOrders = processedOrders.filter(o =>
                o.id.toLowerCase().includes(searchTerm) ||
                (o.customer.name && o.customer.name.toLowerCase().includes(searchTerm))
            );
        }
        setFilteredOrders(processedOrders);
    }, [orders, filters]);

    useEffect(() => {
        applyFilters();
    }, [applyFilters]);
    
    const handleFilterChange = (key: string, value: string) => setFilters(prev => ({ ...prev, [key]: value }));
    const clearFilters = () => setFilters({ status: '', mesa: '', search: '' });
    const getUniqueMesas = () => [...new Set(orders.map(o => o.mesa).filter(Boolean))].sort((a, b) => (a || '').localeCompare(b || ''));
    
    const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
        try {
            await updateOrderStatusMutation({ variables: { orderId, status, restaurantId: config.DEFAULT_RESTAURANT_ID } });
        } catch (e) { console.error("Error actualizando estado:", e); }
    };
    
    if (loading) return <LoadingSpinner />;
    if (error) return <p className="text-red-500 text-center">Error: {error.message}</p>;

    return (
        <div className="space-y-6">
            {/* Filtros y controles */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                    <div className="flex-1">
                        <label htmlFor="status" className="block text-sm font-medium text-gray-300 mb-1">
                            Estado:
                        </label>
                        <select
                            id="status"
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                            className="w-full px-3 py-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Todos</option>
                            <option value="PENDING">Pendiente</option>
                            <option value="CONFIRMED">Confirmado</option>
                            <option value="COMPLETED">Completado</option>
                            <option value="CANCELLED">Cancelado</option>
                        </select>
                    </div>
                    <div className="flex-1">
                        <label htmlFor="mesa" className="block text-sm font-medium text-gray-300 mb-1">
                            Mesa:
                        </label>
                        <select
                            id="mesa"
                            value={filters.mesa}
                            onChange={(e) => handleFilterChange('mesa', e.target.value)}
                            className="w-full px-3 py-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Todas</option>
                            {getUniqueMesas().map(mesa => (
                                <option key={mesa} value={mesa}>
                                    Mesa {mesa}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex-1">
                        <label htmlFor="search" className="block text-sm font-medium text-gray-300 mb-1">
                            Búsqueda:
                        </label>
                        <input
                            type="text"
                            id="search"
                            value={filters.search}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                            placeholder="Buscar por ID o nombre"
                            className="w-full px-3 py-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <button
                        onClick={clearFilters}
                        className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                        Limpiar Filtros
                    </button>
                </div>
            </div>

            {/* Lista de órdenes */}
            <div className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {filteredOrders.map((order) => (
                        <div key={order.id} className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                            {/* Header */}
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-white">#{order.id.substring(0, 7)}</h3>
                                    <p className="text-gray-400 text-sm">
                                        {/* formatTimeElapsed(order.createdAt) */}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="px-3 py-1 rounded-full text-sm bg-gray-700 text-white">
                                      🪑 Mesa {order.mesa || 'N/A'}
                                    </span>
                                </div>
                            </div>

                            {/* Customer Info */}
                            <div className="mb-4">
                                <p className="text-white font-semibold">{order.customer.name}</p>
                            </div>

                            {/* Actions */}
                            <div className="space-y-2">
                                {order.status === 'PENDING' && (
                                    <button
                                        onClick={() => updateOrderStatus(order.id, "CONFIRMED")}
                                        className="w-full px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:opacity-80"
                                    >
                                        Confirmar
                                    </button>
                                )}
                                {order.status === 'CONFIRMED' && (
                                    <button
                                        onClick={() => updateOrderStatus(order.id, "DELIVERED")}
                                        className="w-full px-4 py-2 rounded-lg text-sm font-semibold bg-green-600 text-white hover:opacity-80"
                                    >
                                        Completar
                                    </button>
                                )}
                                {order.status === 'DELIVERED' && (
                                    <button
                                        onClick={() => updateOrderStatus(order.id, "CANCELLED")}
                                        className="w-full px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 text-white hover:opacity-80"
                                    >
                                        Cancelar
                                    </button>
                                )}
                                {order.status === 'CANCELLED' && (
                                    <button
                                        onClick={() => updateOrderStatus(order.id, "DELIVERED")}
                                        className="w-full px-4 py-2 rounded-lg text-sm font-semibold bg-green-600 text-white hover:opacity-80"
                                    >
                                        Marcar como Completado
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
} 