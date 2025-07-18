const API_BASE_URL = 'https://totcw75uzb.execute-api.us-east-1.amazonaws.com/v1';

export interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    image_url?: string;
    available: boolean;
    preparation_time?: number;
    category: string | { id: string; name: string };
    variants?: Array<{
        size: string;
        price: number;
    }>;
    originalId?: string; // ID original de la API
}

// Interfaz para los datos que vienen de la API
interface ApiProduct {
    id: string;
    name: string;
    description: string;
    price: number;
    image_url?: string;
    is_available: boolean;
    preparation_time?: number;
    category: { id: string; name: string };
    variants?: Array<{
        size: string;
        price: number;
    }>;
}

export interface CreateProductData {
    name: string;
    description: string;
    price: number;
    image_url?: string;
    available: boolean;
    category: string;
    restaurant_id: string;
}

export interface Order {
    order_id: string;
    restaurant_id: string;
    customer_name: string;
    customer_phone: string;
    customer_email: string;
    products: Array<{
        id: number;
        name: string;
        cantidad: number;
        precio: number;
    }>;
    total: number;
    payment_method: string;
    delivery_method: string;
    mesa?: string;
    direccion?: string;
    status: string;
    created_at: string;
}

export interface CreateOrderData {
    nombre: string;
    telefono: string;
    correo: string;
    productos: Array<{
        id: number;
        cantidad: number;
        precio: number;
    }>;
    total: number;
    metodo_pago: string;
    modalidad_entrega: string;
    mesa?: string;
    direccion?: string;
}

class ApiService {
    private async sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private async request<T>(endpoint: string, options?: RequestInit, maxRetries: number = 3): Promise<T> {
        const url = `${API_BASE_URL}${endpoint}`;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`🔄 Intentando conectar con la API (intento ${attempt}/${maxRetries}):`, url);

                const headers: Record<string, string> = {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Origin': typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3002',
                };

                // Agregar headers adicionales si existen
                if (options?.headers) {
                    Object.assign(headers, options.headers);
                }

                const response = await fetch(url, {
                    mode: 'cors',
                    headers,
                    ...options,
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`❌ Error de API (${response.status}):`, errorText);
                    throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
                }

                console.log(`✅ Conectado exitosamente con la API`);
                return response.json();

            } catch (error) {
                console.error(`❌ Error en intento ${attempt}:`, error);

                if (attempt === maxRetries) {
                    // En el último intento, lanzar un error más descriptivo
                    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
                        throw new Error(
                            `No se pudo conectar con el servidor de la API. 
                            Por favor verifica:
                            1. Tu conexión a internet
                            2. Que el servidor esté funcionando
                            3. Configuración de CORS del servidor
                            
                            URL: ${url}
                            Error original: ${error.message}`
                        );
                    }
                    throw error;
                }

                // Esperar antes del siguiente intento (backoff exponencial)
                await this.sleep(1000 * attempt);
            }
        }

        throw new Error('Número máximo de intentos agotado');
    }

    // Mapear producto de la API al formato del frontend
    private mapApiProductToProduct(apiProduct: ApiProduct): Product {
        // Crear un hash único basado en el ID original para evitar duplicados
        const hashId = this.generateUniqueId(apiProduct.id);

        return {
            id: hashId,
            name: apiProduct.name,
            description: apiProduct.description,
            price: apiProduct.price,
            image_url: apiProduct.image_url,
            available: apiProduct.is_available,
            preparation_time: apiProduct.preparation_time,
            category: apiProduct.category,
            variants: apiProduct.variants,
            originalId: apiProduct.id // Guardamos el ID original para operaciones
        };
    }

    // Generar un ID único basado en el string
    private generateUniqueId(str: string): number {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convertir a 32-bit integer
        }
        return Math.abs(hash);
    }

    // Productos
    async getProducts(restaurantId: string = 'ay-wey', category?: string): Promise<{ products: Product[]; restaurant_id: string; total: number }> {
        let endpoint = `/api/productos?restaurant_id=${restaurantId}`;
        if (category) {
            endpoint += `&category=${category}`;
        }

        const response = await this.request<{
            products: ApiProduct[];
            restaurant_id: string;
            total: number;
        }>(endpoint);

        return {
            ...response,
            products: response.products.map(product => this.mapApiProductToProduct(product))
        };
    }

    async getProduct(productId: string, restaurantId: string = 'ay-wey'): Promise<{ product: Product; restaurant_id: string }> {
        const response = await this.request<{
            product: ApiProduct;
            restaurant_id: string;
        }>(`/api/productos/${productId}?restaurant_id=${restaurantId}`);

        return {
            ...response,
            product: this.mapApiProductToProduct(response.product)
        };
    }

    async createProduct(productData: CreateProductData, restaurantId: string = 'ay-wey'): Promise<{ success: boolean; product_id: number; message: string }> {
        // Mapear los datos del frontend al formato de la API
        const apiData = {
            ...productData,
            is_available: productData.available
        };
        delete (apiData as Record<string, unknown>).available;

        return this.request(`/api/productos?restaurant_id=${restaurantId}`, {
            method: 'POST',
            body: JSON.stringify(apiData),
        });
    }

    async updateProduct(productId: number, productData: Partial<CreateProductData>, originalId?: string): Promise<{ success: boolean; message: string }> {
        // Mapear los datos del frontend al formato de la API
        const apiData: Record<string, unknown> = { ...productData };
        if ('available' in apiData) {
            apiData.is_available = apiData.available;
            delete apiData.available;
        }

        // Si no se proporciona originalId, lanzar error
        if (!originalId) {
            throw new Error('Se requiere el ID original del producto para la actualización');
        }

        console.log(`🔄 Actualizando producto ${originalId} con datos:`, apiData);

        // SIN restaurant_id en la URL para PUT
        return this.request(`/api/productos/${originalId}`, {
            method: 'PUT',
            body: JSON.stringify(apiData),
        });
    }

    async deleteProduct(productId: number, originalId?: string): Promise<{ success: boolean; message: string }> {
        // Si no se proporciona originalId, lanzar error
        if (!originalId) {
            throw new Error('Se requiere el ID original del producto para la eliminación');
        }

        console.log(`🗑️ Eliminando producto ${originalId}`);

        // SIN restaurant_id en la URL para DELETE
        return this.request(`/api/productos/${originalId}`, {
            method: 'DELETE',
        });
    }

    // Pedidos
    async createOrder(orderData: CreateOrderData, restaurantId: string = 'ay-wey'): Promise<{ success: boolean; order_id: string; message: string }> {
        return this.request(`/api/pedidos?restaurant_id=${restaurantId}`, {
            method: 'POST',
            body: JSON.stringify(orderData),
        });
    }

    async getOrders(restaurantId: string = 'ay-wey', status?: string, limit?: number): Promise<{
        success: boolean;
        restaurant_id: string;
        orders: Order[];
        total_count: number
    }> {
        let endpoint = `/api/pedidos?restaurant_id=${restaurantId}`;
        if (status) endpoint += `&status=${status}`;
        if (limit) endpoint += `&limit=${limit}`;

        return this.request(endpoint);
    }

    async getOrderStatus(orderId: string, restaurantId: string = 'ay-wey'): Promise<Order> {
        return this.request(`/api/pedidos?order_id=${orderId}&restaurant_id=${restaurantId}`);
    }

    async updateOrderStatus(orderId: string, status: string): Promise<{
        success: boolean;
        message: string
    }> {
        // Mapear estados del frontend a los estados que acepta la API
        const statusMapping: Record<string, string> = {
            'pending': 'pending',
            'confirmed': 'pending', // API no tiene 'confirmed', usar 'pending'
            'preparing': 'preparing',
            'ready': 'ready',
            'delivered': 'completed', // Mapear 'delivered' a 'completed'
            'cancelled': 'cancelled'
        };

        const apiStatus = statusMapping[status] || status;
        console.log(`🔄 Mapeando estado: ${status} → ${apiStatus}`);

        // Para órdenes usar query parameter order_id, SIN restaurant_id
        return this.request(`/api/pedidos?order_id=${orderId}`, {
            method: 'PUT',
            body: JSON.stringify({ status: apiStatus }),
        });
    }

    // Categorías
    async getCategories(restaurantId: string = 'ay-wey'): Promise<{
        restaurant_id: string;
        categories: Array<{ id: string; name: string; description: string }>;
        total: number
    }> {
        return this.request(`/api/categorias?restaurant_id=${restaurantId}`);
    }

    // Estadísticas (cuando esté disponible)
    async getRestaurantStats(restaurantId: string = 'ay-wey'): Promise<{
        restaurant_id: string;
        total_orders: number;
        status_breakdown: Record<string, number>;
        total_revenue: number;
        pending_orders: number;
        preparing_orders: number;
    }> {
        return this.request(`/api/stats?restaurant_id=${restaurantId}`);
    }
}

export const apiService = new ApiService(); 