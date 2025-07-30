/**
 * Servicio de API que usa GraphQL exclusivamente
 * Interfaz unificada para el manejo de datos del restaurante
 */

import { graphqlApiService } from './graphql-api';

console.log(`🔧 Usando GraphQL API service exclusivamente`);

/**
 * Servicio principal que usa GraphQL para todas las operaciones
 */
class ApiService {
    private graphqlService: typeof graphqlApiService;

    constructor() {
        this.graphqlService = graphqlApiService;
        console.log('✅ Servicio inicializado: GraphQL API');
    }

    getCurrentService(): string {
        return 'GraphQL';
    }

    /**
     * Métodos de productos
     */
    async getProducts(restaurantId: string = 'ay-wey', category?: string) {
        console.log(`🔄 [GraphQL] Obteniendo productos...`, { restaurantId, category });
        try {
            const result = await this.graphqlService.getProducts(restaurantId, category);
            console.log(`✅ [GraphQL] Productos obtenidos exitosamente: ${result.products.length}`);
            return result;
        } catch (error) {
            console.error(`❌ [GraphQL] Error obteniendo productos:`, error);
            throw error;
        }
    }

    async getProduct(productId: string, restaurantId: string = 'ay-wey') {
        console.log(`🔄 [GraphQL] Obteniendo producto...`, { productId, restaurantId });
        try {
            const result = await this.graphqlService.getProduct(productId, restaurantId);
            console.log(`✅ [GraphQL] Producto obtenido exitosamente: ${result.product.name}`);
            return result;
        } catch (error) {
            console.error(`❌ [GraphQL] Error obteniendo producto:`, error);
            throw error;
        }
    }

    async createProduct(productData: { name: string; description: string; price: number; image_url?: string; available: boolean; category: string }, restaurantId: string = 'ay-wey') {
        console.log(`🔄 [GraphQL] Creando producto...`, { name: productData.name, restaurantId });
        try {
            const productWithRestaurant = { ...productData, restaurant_id: restaurantId };
            const result = await this.graphqlService.createProduct(productWithRestaurant, restaurantId);
            console.log(`✅ [GraphQL] Producto creado exitosamente: ${result.product_id}`);
            return result;
        } catch (error) {
            console.error(`❌ [GraphQL] Error creando producto:`, error);
            throw error;
        }
    }

    async updateProduct(productId: number, productData: Partial<{ name: string; description: string; price: number; image_url?: string; available: boolean; category: string }>, restaurantId: string = 'ay-wey') {
        console.log(`🔄 [GraphQL] Actualizando producto...`, { productId, restaurantId });
        try {
            const result = await this.graphqlService.updateProduct(productId, productData, restaurantId);
            console.log(`✅ [GraphQL] Producto actualizado exitosamente`);
            return result;
        } catch (error) {
            console.error(`❌ [GraphQL] Error actualizando producto:`, error);
            throw error;
        }
    }

    async deleteProduct(productId: number, restaurantId: string = 'ay-wey') {
        console.log(`🔄 [GraphQL] Eliminando producto...`, { productId, restaurantId });
        try {
            const result = await this.graphqlService.deleteProduct(productId, restaurantId);
            console.log(`✅ [GraphQL] Producto eliminado exitosamente`);
            return result;
        } catch (error) {
            console.error(`❌ [GraphQL] Error eliminando producto:`, error);
            throw error;
        }
    }

    /**
     * Métodos de pedidos
     */
    async createOrder(orderData: { nombre: string; telefono: string; correo: string; productos: Array<{ id: number; cantidad: number; precio: number }>; total: number; metodo_pago: string; modalidad_entrega: string; mesa?: string; direccion?: string }, restaurantId: string = 'ay-wey') {
        console.log(`🔄 [GraphQL] Creando orden...`, { restaurantId, modalidad: orderData.modalidad_entrega });
        try {
            const result = await this.graphqlService.createOrder(orderData, restaurantId);
            console.log(`✅ [GraphQL] Orden creada exitosamente: ${result.order_id}`);
            return result;
        } catch (error) {
            console.error(`❌ [GraphQL] Error creando orden:`, error);
            throw error;
        }
    }

    async getOrders(restaurantId: string = 'ay-wey', status?: string, limit?: number, forceRefresh: boolean = false) {
        console.log(`🔄 [GraphQL] Obteniendo órdenes...`, { restaurantId, status, limit, forceRefresh });
        try {
            const result = await this.graphqlService.getOrders(restaurantId, status, limit, forceRefresh);
            console.log(`✅ [GraphQL] Órdenes obtenidas exitosamente: ${result.orders.length}`);
            return result;
        } catch (error) {
            console.error(`❌ [GraphQL] Error obteniendo órdenes:`, error);
            throw error;
        }
    }

    async getOrderStatus(orderId: string, restaurantId: string = 'ay-wey') {
        console.log(`🔄 [GraphQL] Obteniendo estado de orden...`, { orderId, restaurantId });
        try {
            const result = await this.graphqlService.getOrderStatus(orderId, restaurantId);
            console.log(`✅ [GraphQL] Estado de orden obtenido exitosamente: ${result.status}`);
            return result;
        } catch (error) {
            console.error(`❌ [GraphQL] Error obteniendo estado de orden:`, error);
            throw error;
        }
    }

    async updateOrderStatus(orderId: string, status: string, restaurantId: string = 'ay-wey') {
        console.log(`🔄 [GraphQL] Actualizando estado de orden...`, { orderId, status, restaurantId });
        try {
            const result = await this.graphqlService.updateOrderStatus(orderId, status, restaurantId);
            console.log(`✅ [GraphQL] Estado de orden actualizado exitosamente`);
            return result;
        } catch (error) {
            console.error(`❌ [GraphQL] Error actualizando estado de orden:`, error);
            throw error;
        }
    }

    async addProductToOrder(orderId: string, productId: string, quantity: number, restaurantId: string = 'ay-wey') {
        console.log(`🔄 [GraphQL] Añadiendo producto a la orden...`, { orderId, productId, quantity, restaurantId });
        try {
            const result = await this.graphqlService.addProductToOrder(orderId, productId, quantity, restaurantId);
            console.log(`✅ [GraphQL] Producto añadido a la orden exitosamente`);
            return result;
        } catch (error) {
            console.error(`❌ [GraphQL] Error añadiendo producto a la orden:`, error);
            throw error;
        }
    }

    async removeProductFromOrder(orderId: string, productId: string, restaurantId: string = 'ay-wey') {
        console.log(`🔄 [GraphQL] Eliminando producto de la orden...`, { orderId, productId, restaurantId });
        try {
            const result = await this.graphqlService.removeProductFromOrder(orderId, productId, restaurantId);
            console.log(`✅ [GraphQL] Producto eliminado de la orden exitosamente`);
            return result;
        } catch (error) {
            console.error(`❌ [GraphQL] Error eliminando producto de la orden:`, error);
            throw error;
        }
    }

    async updateProductQuantityInOrder(orderId: string, productId: string, quantity: number, restaurantId: string = 'ay-wey') {
        console.log(`🔄 [GraphQL] Actualizando cantidad del producto en la orden...`, { orderId, productId, quantity, restaurantId });
        try {
            const result = await this.graphqlService.updateProductQuantityInOrder(orderId, productId, quantity, restaurantId);
            console.log(`✅ [GraphQL] Cantidad del producto actualizada exitosamente`);
            return result;
        } catch (error) {
            console.error(`❌ [GraphQL] Error actualizando cantidad del producto:`, error);
            throw error;
        }
    }

    /**
     * Métodos de categorías y estadísticas
     */
    async getCategories(restaurantId: string = 'ay-wey') {
        console.log(`🔄 [GraphQL] Obteniendo categorías...`, { restaurantId });
        try {
            const result = await this.graphqlService.getCategories(restaurantId);
            console.log(`✅ [GraphQL] Categorías obtenidas exitosamente: ${result.categories.length}`);
            return result;
        } catch (error) {
            console.error(`❌ [GraphQL] Error obteniendo categorías:`, error);
            throw error;
        }
    }

    async getRestaurantStats(restaurantId: string = 'ay-wey') {
        console.log(`🔄 [GraphQL] Obteniendo estadísticas del restaurante...`, { restaurantId });
        try {
            const result = await this.graphqlService.getRestaurantStats(restaurantId);
            console.log(`✅ [GraphQL] Estadísticas obtenidas exitosamente: ${result.total_orders} órdenes totales`);
            return result;
        } catch (error) {
            console.error(`❌ [GraphQL] Error obteniendo estadísticas:`, error);
            throw error;
        }
    }

    async createCategory(categoryData: { name: string; description?: string }, restaurantId: string = 'ay-wey') {
        console.log(`🔄 [GraphQL] Creando categoría...`, { name: categoryData.name, restaurantId });
        try {
            const result = await this.graphqlService.createCategory(categoryData, restaurantId);
            console.log(`✅ [GraphQL] Categoría creada exitosamente: ${result.id}`);
            return result;
        } catch (error) {
            console.error(`❌ [GraphQL] Error creando categoría:`, error);
            throw error;
        }
    }

    /**
     * Método para limpiar cache de Apollo Client
     */
    async clearCache() {
        console.log(`🧹 [GraphQL] Limpiando cache...`);
        try {
            await this.graphqlService.clearCache();
            console.log('✅ [GraphQL] Cache limpiado exitosamente');
        } catch (error) {
            console.error('❌ [GraphQL] Error limpiando cache:', error);
            throw error;
        }
    }

    getConnectionStatus(): string {
        return this.graphqlService.getConnectionStatus();
    }

    /**
     * Método de diagnóstico para verificar si el servicio está funcionando
     */
    async testConnection(): Promise<{ service: string; status: string; details?: unknown }> {
        console.log(`🔍 [GraphQL] Realizando test de conexión...`);
        try {
            const result = await this.graphqlService.getProducts('ay-wey');
            console.log(`✅ [GraphQL] Test de conexión exitoso: ${result.products.length} productos encontrados`);
            return {
                service: 'GraphQL',
                status: 'success',
                details: {
                    products: result.products.length,
                    restaurant_id: result.restaurant_id
                }
            };
        } catch (error) {
            console.error(`❌ [GraphQL] Test de conexión falló:`, error);
            return {
                service: 'GraphQL',
                status: 'error',
                details: error instanceof Error ? error.message : 'Error desconocido'
            };
        }
    }
}

// Crear instancia única del servicio
const apiService = new ApiService();

// Exportar la instancia
export { apiService };

// Exportar tipos desde el servicio GraphQL para compatibilidad
export type { Order, Product, CreateOrderInput as CreateOrderData, OrderStatus, DeliveryMethod, PaymentMethod } from '../types/graphql'; 
