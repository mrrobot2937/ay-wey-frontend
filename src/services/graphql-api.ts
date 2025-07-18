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
    CREATE_CATEGORY
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
    convertLegacyOrderDataToGraphQL,
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
        products: LegacyProduct[];
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

            console.log(`📊 Respuesta GraphQL:`, data);
            console.log(`📦 Productos en respuesta:`, data.products);

            let products: Product[] = data.products || [];

            console.log(`🔍 Productos antes del filtro:`, products.length);
            console.log(`🔍 Primeros productos:`, products.slice(0, 3));

            // Filtrar por categoría si se especifica
            if (category) {
                products = products.filter(p =>
                    typeof p.category === 'object'
                        ? p.category.id === category || p.category.name === category
                        : p.category === category
                );
                console.log(`🔍 Productos después del filtro por categoría:`, products.length);
            }

            const legacyProducts = products.map(convertProductToLegacy);

            console.log(`✅ ${legacyProducts.length} productos obtenidos exitosamente`);
            console.log(`🔍 Primeros productos legacy:`, legacyProducts.slice(0, 3));

            return {
                products: legacyProducts,
                restaurant_id: restaurantId,
                total: legacyProducts.length
            };
        } catch (error) {
            console.error('❌ Error obteniendo productos:', error);
            throw new Error(`Error obteniendo productos: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
    }

    async getProduct(productId: string, restaurantId: string = this.defaultRestaurantId): Promise<{
        product: LegacyProduct;
        restaurant_id: string;
    }> {
        try {
            console.log(`🔄 Obteniendo producto: ${productId}`);

            // Si el productId es numérico, necesitamos encontrar el ID original
            let actualProductId = productId;
            if (!isNaN(Number(productId))) {
                // Es un ID numérico, necesitamos obtener todos los productos y encontrar el original
                const productsResponse = await this.getProducts(restaurantId);
                const legacyProduct = productsResponse.products.find(p => p.id === Number(productId));
                if (legacyProduct?.originalId) {
                    actualProductId = legacyProduct.originalId;
                } else {
                    throw new Error(`Producto no encontrado: ${productId}`);
                }
            }

            const { data } = await apolloClient.query({
                query: GET_PRODUCT,
                variables: { productId: actualProductId },
                fetchPolicy: 'cache-first'
            });

            if (!data.product) {
                throw new Error(`Producto no encontrado: ${productId}`);
            }

            const legacyProduct = convertProductToLegacy(data.product);

            console.log(`✅ Producto obtenido exitosamente: ${legacyProduct.name}`);

            return {
                product: legacyProduct,
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
        productId: number,
        productData: Partial<CreateProductData>,
        restaurantId: string = this.defaultRestaurantId,
        originalId?: string
    ): Promise<{ success: boolean; message: string }> {
        try {
            console.log(`🔄 Actualizando producto: ${productId}`, { originalId, restaurantId });

            // Usar el originalId si está disponible, sino buscar en productos
            let actualProductId = originalId;
            if (!actualProductId) {
                console.log(`🔍 Buscando originalId para producto ${productId}...`);
                const productsResponse = await this.getProducts(restaurantId);
                console.log(`📊 Total productos encontrados: ${productsResponse.products.length}`);

                // Debug: mostrar algunos IDs para entender el formato
                if (productsResponse.products.length > 0) {
                    console.log(`🔍 Primeros productos:`, productsResponse.products.slice(0, 3).map(p => ({
                        id: p.id,
                        originalId: p.originalId,
                        name: p.name
                    })));
                }

                const legacyProduct = productsResponse.products.find(p => p.id === productId);
                console.log(`🔍 Producto buscado con ID ${productId}:`, legacyProduct ? {
                    id: legacyProduct.id,
                    originalId: legacyProduct.originalId,
                    name: legacyProduct.name
                } : 'NO ENCONTRADO');

                if (!legacyProduct?.originalId) {
                    // Intentar búsqueda más flexible
                    const alternativeProduct = productsResponse.products.find(p =>
                        String(p.id) === String(productId) || p.originalId === String(productId)
                    );

                    if (alternativeProduct?.originalId) {
                        console.log(`✅ Producto encontrado con búsqueda alternativa: ${alternativeProduct.originalId}`);
                        actualProductId = alternativeProduct.originalId;
                    } else {
                        console.error(`❌ Producto no encontrado. Búsquedas intentadas:`, {
                            productIdBuscado: productId,
                            tipoProductId: typeof productId,
                            totalProductos: productsResponse.products.length,
                            productosIds: productsResponse.products.map(p => ({ id: p.id, tipo: typeof p.id }))
                        });
                        throw new Error(`Producto no encontrado: ${productId}`);
                    }
                } else {
                    actualProductId = legacyProduct.originalId;
                }
            }

            console.log(`🎯 Usando actualProductId: ${actualProductId}`);


            const input: UpdateProductInput = {};
            if (productData.name !== undefined) input.name = productData.name;
            if (productData.description !== undefined) input.description = productData.description;
            if (productData.price !== undefined) input.price = productData.price;
            if (productData.image_url !== undefined) input.imageUrl = productData.image_url;
            if (productData.available !== undefined) input.available = productData.available;
            if (productData.category !== undefined) input.categoryId = productData.category;
            if (productData.variants !== undefined) input.variants = productData.variants;

            const { data } = await apolloClient.mutate({
                mutation: UPDATE_PRODUCT,
                variables: { productId: actualProductId, input },
                refetchQueries: [
                    { query: GET_PRODUCTS, variables: { restaurantId } }
                ]
            });

            const result = data.updateProduct;

            if (result.success) {
                console.log(`✅ Producto actualizado exitosamente: ${actualProductId}`);
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
        productId: number,
        restaurantId: string = this.defaultRestaurantId,
        originalId?: string
    ): Promise<{ success: boolean; message: string }> {
        try {
            console.log(`🔄 Eliminando producto: ${productId}`);

            // Usar el originalId si está disponible, sino buscar en productos
            let actualProductId = originalId;
            if (!actualProductId) {
                const productsResponse = await this.getProducts(restaurantId);
                const legacyProduct = productsResponse.products.find(p => p.id === productId);
                if (!legacyProduct?.originalId) {
                    throw new Error(`Producto no encontrado: ${productId}`);
                }
                actualProductId = legacyProduct.originalId;
            }

            const { data } = await apolloClient.mutate({
                mutation: DELETE_PRODUCT,
                variables: { productId: actualProductId },
                refetchQueries: [
                    { query: GET_PRODUCTS, variables: { restaurantId } }
                ]
            });

            const result = data.deleteProduct;

            if (result.success) {
                console.log(`✅ Producto eliminado exitosamente: ${actualProductId}`);
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
        orders: LegacyOrder[];
        total_count: number;
    }> {
        try {
            console.log(`🔄 Obteniendo pedidos para restaurante: ${restaurantId}`, {
                status,
                limit,
                forceRefresh,
                timestamp: new Date().toISOString()
            });

            // SIEMPRE usar network-only para órdenes - los datos deben ser frescos
            const fetchPolicy = 'network-only';
            console.log(`📡 Política de cache: ${fetchPolicy}`);

            // NO usar clearCache que causa problemas - solo usar network-only
            console.log('🌐 Obteniendo datos frescos directamente del servidor...');

            const { data } = await apolloClient.query({
                query: GET_ORDERS,
                variables: { restaurantId, status, limit },
                fetchPolicy: fetchPolicy,
                errorPolicy: 'all'
            });

            if (!data) {
                throw new Error('No se recibieron datos del servidor GraphQL');
            }

            const orders: Order[] = data.orders || [];
            const legacyOrders = orders.map(convertOrderToLegacy);

            console.log(`✅ ${legacyOrders.length} pedidos obtenidos exitosamente`, {
                timestamp: new Date().toISOString(),
                orderIds: legacyOrders.map(o => o.order_id),
                statuses: legacyOrders.map(o => o.status),
                deliveryMethods: legacyOrders.map(o => o.delivery_method),
                sample: legacyOrders.slice(0, 3).map(o => ({
                    id: o.order_id,
                    status: o.status,
                    method: o.delivery_method,
                    customer: o.customer_name
                }))
            });

            return {
                success: true,
                restaurant_id: restaurantId,
                orders: legacyOrders,
                total_count: legacyOrders.length
            };
        } catch (error) {
            console.error('❌ Error obteniendo pedidos:', error);
            throw new Error(`Error obteniendo pedidos: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
    }

    async getOrderStatus(orderId: string, restaurantId: string = this.defaultRestaurantId): Promise<LegacyOrder> {
        try {
            console.log(`🔄 Obteniendo estado del pedido: ${orderId}`);

            const ordersResponse = await this.getOrders(restaurantId);
            const order = ordersResponse.orders.find(o => o.order_id === orderId);

            if (!order) {
                throw new Error(`Pedido no encontrado: ${orderId}`);
            }

            console.log(`✅ Estado del pedido obtenido: ${order.status}`);
            return order;
        } catch (error) {
            console.error('❌ Error obteniendo estado del pedido:', error);
            throw new Error(`Error obteniendo estado del pedido: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
    }

    async updateOrderStatus(
        orderId: string,
        status: string,
        restaurantId: string = this.defaultRestaurantId
    ): Promise<{ success: boolean; message: string }> {
        try {
            console.log(`🔄 Actualizando estado del pedido: ${orderId} -> ${status}`);

            const { data } = await apolloClient.mutate({
                mutation: UPDATE_ORDER_STATUS,
                variables: { orderId, status },
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