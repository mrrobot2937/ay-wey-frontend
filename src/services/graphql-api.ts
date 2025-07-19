import { apolloClient } from '../lib/apollo-client';
import {
    GET_PRODUCTS,
    GET_PRODUCT,
    GET_CATEGORIES,
    GET_ORDERS,
    GET_RESTAURANT_STATS,
    CREATE_PRODUCT,
    UPDATE_PRODUCT,
    DELETE_PRODUCT,
    CREATE_ORDER,
    UPDATE_ORDER_STATUS,
    CREATE_CATEGORY,
    ADD_PRODUCT_TO_ORDER
} from '../graphql/queries';
import {
    Product,
    Order,
    LegacyProduct,
    LegacyOrder,
    LegacyCreateOrderData,
    CreateProductInput,
    UpdateProductInput,
    CreateCategoryInput,
    convertProductToLegacy,
    convertOrderToLegacy,
    convertLegacyOrderDataToGraphQLWithOriginalIds
} from '../types/graphql';

// Interfaces para mantener compatibilidad con el código existente
interface CreateProductData {
    name: string;
    description: string;
    price: number;
    image_url?: string;
    available: boolean;
    category: string;
    restaurant_id: string;
    variants?: Array<{
        size: string;
        price: number;
        image_url?: string;
    }>;
}

/**
 * Servicio GraphQL que mantiene compatibilidad con la API REST anterior
 * Permite migración gradual del frontend sin romper funcionalidad existente
 */
class GraphQLApiService {
    private defaultRestaurantId = 'ay-wey';

    /**
     * Productos
     */
    async getProducts(restaurantId: string = this.defaultRestaurantId, category?: string): Promise<{
        products: Product[];
        restaurant_id: string;
        total: number;
    }> {
        try {
            console.log(`🔄 Obteniendo productos para restaurante: ${restaurantId}`);

            const { data } = await apolloClient.query({
                query: GET_PRODUCTS,
                variables: { restaurantId },
                fetchPolicy: 'cache-first'
            });

            let products: Product[] = data.products || [];

            // Filtrar por categoría si se especifica
            if (category) {
                products = products.filter(p =>
                    typeof p.category === 'object'
                        ? p.category.id === category || p.category.name === category
                        : p.category === category
                );
            }

            return {
                products: products,
                restaurant_id: restaurantId,
                total: products.length
            };
        } catch (error) {
            console.error('❌ Error obteniendo productos:', error);
            throw new Error(`Error obteniendo productos: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
    }

    async getProduct(productId: string, restaurantId: string = this.defaultRestaurantId): Promise<{
        product: Product;
        restaurant_id: string;
    }> {
        try {
            console.log(`🔄 Obteniendo producto: ${productId}`);

            const { data } = await apolloClient.query({
                query: GET_PRODUCT,
                variables: { productId },
                fetchPolicy: 'cache-first'
            });

            if (!data.product) {
                throw new Error(`Producto no encontrado: ${productId}`);
            }

            return {
                product: data.product,
                restaurant_id: restaurantId
            };
        } catch (error) {
            console.error('❌ Error obteniendo producto:', error);
            throw new Error(`Error obteniendo producto: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
    }

    async createProduct(productData: CreateProductData, restaurantId: string = this.defaultRestaurantId): Promise<{
        success: boolean;
        product_id: number;
        message: string;
    }> {
        try {
            console.log(`🔄 Creando producto: ${productData.name}`);

            const input: CreateProductInput = {
                name: productData.name,
                description: productData.description,
                price: productData.price,
                imageUrl: productData.image_url,
                available: productData.available,
                categoryId: productData.category,
                restaurantId,
                variants: productData.variants
            };

            const { data } = await apolloClient.mutate({
                mutation: CREATE_PRODUCT,
                variables: { input },
                refetchQueries: [
                    { query: GET_PRODUCTS, variables: { restaurantId } }
                ]
            });

            const result = data.createProduct;

            if (result.success) {
                // Generar ID numérico para compatibilidad
                const numericId = this.generateNumericId(result.id);

                console.log(`✅ Producto creado exitosamente: ${result.id}`);

                return {
                    success: true,
                    product_id: numericId,
                    message: result.message
                };
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('❌ Error creando producto:', error);
            throw new Error(`Error creando producto: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
    }

    async updateProduct(
        productId: string,
        productData: Partial<UpdateProductInput>,
        restaurantId: string = this.defaultRestaurantId
    ): Promise<{ success: boolean; message: string }> {
        try {
            console.log(`🔄 Actualizando producto: ${productId}`);

            const input: UpdateProductInput = { ...productData };

            const { data } = await apolloClient.mutate({
                mutation: UPDATE_PRODUCT,
                variables: { id: productId, input },
                refetchQueries: [
                    { query: GET_PRODUCTS, variables: { restaurantId } }
                ]
            });

            const result = data.updateProduct;
            if (result.success) {
                console.log(`✅ Producto actualizado exitosamente`);
                return {
                    success: true,
                    message: result.message
                };
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('❌ Error actualizando producto:', error);
            throw new Error(`Error actualizando producto: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
    }

    async deleteProduct(
        productId: string,
        restaurantId: string = this.defaultRestaurantId
    ): Promise<{ success: boolean; message: string }> {
        try {
            console.log(`🔄 Eliminando producto: ${productId}`);
            const { data } = await apolloClient.mutate({
                mutation: DELETE_PRODUCT,
                variables: { id: productId, restaurantId },
                refetchQueries: [
                    { query: GET_PRODUCTS, variables: { restaurantId } }
                ]
            });

            const result = data.deleteProduct;
            if (result.success) {
                console.log(`✅ Producto eliminado exitosamente`);
                return {
                    success: true,
                    message: result.message
                };
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('❌ Error eliminando producto:', error);
            throw new Error(`Error eliminando producto: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
    }

    /**
     * Pedidos
     */
    async createOrder(
        orderData: LegacyCreateOrderData,
        restaurantId: string = this.defaultRestaurantId
    ): Promise<{ success: boolean; order_id: string; message: string }> {
        try {
            console.log(`🔄 Creando pedido para: ${orderData.nombre}`);

            // Obtener productos para buscar IDs originales
            const productsResponse = await this.getProducts(restaurantId);
            const input = convertLegacyOrderDataToGraphQLWithOriginalIds(orderData, productsResponse.products, restaurantId);

            console.log(`🔍 Productos en orden:`, orderData.productos.map(p => ({ id: p.id, cantidad: p.cantidad })));
            console.log(`🔍 IDs originales encontrados:`, input.products.map(p => ({ id: p.id, quantity: p.quantity })));

            const { data } = await apolloClient.mutate({
                mutation: CREATE_ORDER,
                variables: { input },
                refetchQueries: [
                    { query: GET_ORDERS, variables: { restaurantId } }
                ]
            });

            const result = data.createOrder;

            if (result.success) {
                console.log(`✅ Pedido creado exitosamente: ${result.id}`);
                return {
                    success: true,
                    order_id: result.id,
                    message: result.message
                };
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('❌ Error creando pedido:', error);
            throw new Error(`Error creando pedido: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
    }

    async getOrders(
        restaurantId: string = this.defaultRestaurantId,
        status?: string,
        limit?: number,
        forceRefresh: boolean = false
    ): Promise<{
        success: boolean;
        restaurant_id: string;
        orders: Order[];
        total_count: number;
    }> {
        try {
            console.log(`🔄 Obteniendo órdenes...`, { restaurantId, status, limit });

            const { data } = await apolloClient.query({
                query: GET_ORDERS,
                variables: { restaurantId, status, limit },
                fetchPolicy: forceRefresh ? 'network-only' : 'cache-first'
            });

            const orders: Order[] = data.orders || [];

            console.log(`✅ ${orders.length} órdenes obtenidas exitosamente`);

            return {
                success: true,
                restaurant_id: restaurantId,
                orders: orders,
                total_count: orders.length
            };
        } catch (error) {
            console.error('❌ Error obteniendo órdenes:', error);
            throw new Error(`Error obteniendo órdenes: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
    }

    async getOrderStatus(orderId: string, restaurantId: string = this.defaultRestaurantId): Promise<Order> {
        try {
            console.log(`🔄 Obteniendo estado de orden: ${orderId}`);
            const { data } = await apolloClient.query({
                query: GET_ORDERS, // Reutilizamos la query de órdenes
                variables: { restaurantId }
            });

            const order = data.orders.find((o: Order) => o.id === orderId);

            if (!order) {
                throw new Error(`Orden no encontrada: ${orderId}`);
            }

            return order;
        } catch (error) {
            console.error('❌ Error obteniendo estado de orden:', error);
            throw new Error(`Error obteniendo estado de orden: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
    }

    async updateOrderStatus(
        orderId: string,
        status: string,
        restaurantId: string = this.defaultRestaurantId
    ): Promise<{ success: boolean; message: string }> {
        try {
            console.log(`🔄 Actualizando estado de orden: ${orderId} a ${status}`);
            const { data } = await apolloClient.mutate({
                mutation: UPDATE_ORDER_STATUS,
                variables: { orderId, status, restaurantId }, // <-- AÑADIR restaurantId aquí
                refetchQueries: [
                    { query: GET_ORDERS, variables: { restaurantId } }
                ]
            });
            const result = data.updateOrderStatus;
            if (result.success) {
                console.log(`✅ Estado del pedido actualizado exitosamente`);
                return {
                    success: true,
                    message: result.message
                };
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('❌ Error actualizando estado del pedido:', error);
            throw new Error(`Error actualizando estado del pedido: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
    }

    async addProductToOrder(
        orderId: string,
        productId: string,
        quantity: number,
        restaurantId: string = this.defaultRestaurantId
    ): Promise<{ success: boolean; message: string; order?: any }> {
        try {
            console.log(`🔄 Añadiendo producto a la orden: ${orderId}`);
            const { data } = await apolloClient.mutate({
                mutation: ADD_PRODUCT_TO_ORDER,
                variables: { orderId, productId, quantity, restaurantId },
                refetchQueries: [
                    { query: GET_ORDERS, variables: { restaurantId } }
                ]
            });
            const result = data.addProductToOrder;
            if (result.success) {
                console.log(`✅ Producto añadido a la orden exitosamente: ${orderId}`);
                return {
                    success: true,
                    message: result.message,
                    order: result.order
                };
            } else {
                throw new Error(result.message || 'Error desconocido al añadir producto');
            }
        } catch (error) {
            console.error('❌ Error añadiendo producto a la orden:', error);
            throw new Error(`Error añadiendo producto a la orden: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
    }

    /**
     * Categorías y estadísticas
     */
    async getCategories(restaurantId: string = this.defaultRestaurantId): Promise<{
        restaurant_id: string;
        categories: Array<{ id: string; name: string; description: string }>;
        total: number;
    }> {
        try {
            console.log(`🔄 Obteniendo categorías para restaurante: ${restaurantId}`);

            const { data } = await apolloClient.query({
                query: GET_CATEGORIES,
                variables: { restaurantId },
                fetchPolicy: 'cache-first'
            });

            const categories = data.categories || [];

            console.log(`✅ ${categories.length} categorías obtenidas exitosamente`);

            return {
                restaurant_id: restaurantId,
                categories,
                total: categories.length
            };
        } catch (error) {
            console.error('❌ Error obteniendo categorías:', error);
            throw new Error(`Error obteniendo categorías: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
    }

    async getRestaurantStats(restaurantId: string = this.defaultRestaurantId): Promise<{
        restaurant_id: string;
        total_orders: number;
        status_breakdown: Record<string, number>;
        total_revenue: number;
        pending_orders: number;
        preparing_orders: number;
    }> {
        try {
            console.log(`🔄 Obteniendo estadísticas para restaurante: ${restaurantId}`);

            const { data } = await apolloClient.query({
                query: GET_RESTAURANT_STATS,
                variables: { restaurantId },
                fetchPolicy: 'cache-first'
            });

            const stats = data.restaurantStats;

            console.log(`✅ Estadísticas obtenidas exitosamente`);

            return {
                restaurant_id: stats.restaurantId,
                total_orders: stats.totalOrders,
                status_breakdown: stats.statusBreakdown,
                total_revenue: stats.totalRevenue,
                pending_orders: stats.pendingOrders,
                preparing_orders: stats.preparingOrders
            };
        } catch (error) {
            console.error('❌ Error obteniendo estadísticas:', error);
            throw new Error(`Error obteniendo estadísticas: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
    }

    async createCategory(categoryData: { name: string; description?: string }, restaurantId: string = this.defaultRestaurantId): Promise<{
        success: boolean;
        id: string;
        message: string;
    }> {
        try {
            console.log(`🔄 Creando categoría: ${categoryData.name}`);

            const input: CreateCategoryInput = {
                name: categoryData.name,
                description: categoryData.description,
                restaurantId
            };

            const { data } = await apolloClient.mutate({
                mutation: CREATE_CATEGORY,
                variables: { input },
                refetchQueries: [
                    { query: GET_CATEGORIES, variables: { restaurantId } }
                ]
            });

            const result = data.createCategory;

            if (result.success) {
                console.log(`✅ Categoría creada exitosamente: ${result.id}`);
                return {
                    success: true,
                    id: result.id,
                    message: result.message
                };
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('❌ Error creando categoría:', error);
            throw new Error(`Error creando categoría: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
    }

    /**
     * Métodos auxiliares
     */
    private generateNumericId(str: string): number {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    }

    /**
     * Limpiar cache (útil para desarrollo) - versión segura
     */
    async clearCache(): Promise<void> {
        try {
            console.log('🧹 Intentando limpiar cache Apollo...');

            // Intentar métodos más seguros primero
            try {
                await apolloClient.resetStore();
                console.log('✅ Cache reseteado exitosamente con resetStore()');
                return;
            } catch {
                console.warn('⚠️ resetStore() falló, intentando clearStore()...');

                try {
                    await apolloClient.clearStore();
                    console.log('✅ Cache limpiado exitosamente con clearStore()');
                    return;
                } catch {
                    console.warn('⚠️ clearStore() también falló, usando refetchQueries...');

                    // Último recurso: invalidar consultas específicas
                    await apolloClient.refetchQueries({
                        include: 'active'
                    });
                    console.log('✅ Consultas activas refrescadas');
                    return;
                }
            }
        } catch (error) {
            console.error('❌ Error limpiando cache (continuando sin cache clean):', error);
            // No lanzar error - el sistema puede continuar sin limpiar cache
        }
    }

    /**
     * Obtener estado de la conexión
     */
    getConnectionStatus(): string {
        // Apollo Client maneja automáticamente el estado de conexión
        return 'Connected via GraphQL';
    }
}

// Exportar instancia única
export const graphqlApiService = new GraphQLApiService();
export default graphqlApiService; 