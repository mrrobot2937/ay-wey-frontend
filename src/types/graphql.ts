// ===================================================================
// INTERFACES PARA GRAPHQL (actualizadas para coincidir con el backend)
// ===================================================================

export interface ProductVariant {
    size: string;
    price: number;
    imageUrl?: string;
}

export interface Category {
    id: string;
    name: string;
    description?: string;
}

export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    imageUrl?: string;
    available: boolean;
    preparationTime?: number;
    restaurantId: string;
    category: Category;
    variants?: ProductVariant[];
}

export interface OrderProduct {
    id: string;
    name: string;
    quantity: number;
    price: number;
    total: number;
}

export interface Customer {
    name: string;
    phone: string;
    email?: string;
}

export interface Order {
    id: string;
    restaurantId: string;
    customer: Customer;
    products: OrderProduct[];
    total: number;
    paymentMethod: string;
    deliveryMethod: string;
    mesa?: string;
    deliveryAddress?: string;
    status: string;
    createdAt: string;
    updatedAt: string;
}

export interface RestaurantStats {
    restaurantId: string;
    totalOrders: number;
    totalRevenue: number;
    pendingOrders: number;
    preparingOrders: number;
    statusBreakdown: Record<string, number>;
}

export interface OperationResult {
    success: boolean;
    message: string;
    id?: string;
}

// ===================================================================
// INPUTS PARA CREAR/ACTUALIZAR (usados en mutations)
// ===================================================================

export interface CreateProductInput {
    name: string;
    description: string;
    price: number;
    imageUrl?: string;
    available: boolean;
    categoryId: string;
    restaurantId: string;
    variants?: Array<{
        size: string;
        price: number;
        imageUrl?: string;
    }>;
}

export interface UpdateProductInput {
    name?: string;
    description?: string;
    price?: number;
    imageUrl?: string;
    available?: boolean;
    categoryId?: string;
    variants?: Array<{
        size: string;
        price: number;
        imageUrl?: string;
    }>;
}

export interface CreateCategoryInput {
    name: string;
    description?: string;
    restaurantId: string;
}

export interface OrderProductInput {
    id: string;
    quantity: number;
    price: number;
}

export interface CreateOrderInput {
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    restaurantId: string;
    products: OrderProductInput[];
    total: number;
    paymentMethod: string;
    deliveryMethod: string;
    mesa?: string;
    deliveryAddress?: string;
}

// ===================================================================
// INTERFACES PARA COMPATIBILIDAD CON EL CÓDIGO EXISTENTE
// ===================================================================

// Para mantener compatibilidad con el código existente que espera ciertos campos
export interface LegacyProduct {
    id: number; // El frontend actual usa números
    name: string;
    description: string;
    price: number;
    image_url?: string; // snake_case del frontend actual
    available: boolean;
    preparation_time?: number;
    category: string | Category; // El frontend actual acepta ambos
    variants?: Array<{
        size: string;
        price: number;
        imageUrl?: string;
    }>;
    originalId?: string; // Para mantener referencia al ID de GraphQL
}

export interface LegacyOrder {
    order_id: string;
    restaurant_id: string;
    customer_name: string;
    customer_phone: string;
    customer_email: string;
    products: Array<{
        id: number;
        name: string;
        nombre?: string; // Campo adicional para compatibilidad
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

export interface LegacyCreateOrderData {
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

// ===================================================================
// UTILIDADES DE CONVERSIÓN
// ===================================================================

/**
 * Convierte un producto GraphQL al formato legacy que espera el frontend
 */
export function convertProductToLegacy(product: Product): LegacyProduct {
    // Generar un ID numérico único basado en el string ID
    const numericId = generateNumericId(product.id);

    return {
        id: numericId,
        name: product.name,
        description: product.description,
        price: product.price,
        image_url: product.imageUrl,
        available: product.available,
        preparation_time: product.preparationTime,
        category: product.category,
        variants: product.variants,
        originalId: product.id
    };
}

/**
 * Convierte un pedido GraphQL al formato legacy que espera el frontend
 */
export function convertOrderToLegacy(order: Order): LegacyOrder {
    return {
        order_id: order.id,
        restaurant_id: order.restaurantId,
        customer_name: order.customer.name,
        customer_phone: order.customer.phone,
        customer_email: order.customer.email || '',
        products: order.products.map(p => ({
            id: generateNumericId(p.id),
            name: p.name,
            cantidad: p.quantity,
            precio: p.price
        })),
        total: order.total,
        payment_method: order.paymentMethod,
        delivery_method: order.deliveryMethod,
        mesa: order.mesa,
        direccion: order.deliveryAddress,
        status: order.status,
        created_at: order.createdAt
    };
}

/**
 * Convierte datos de pedido legacy al formato GraphQL
 */
export function convertLegacyOrderDataToGraphQL(data: LegacyCreateOrderData, restaurantId: string = 'ay-wey'): CreateOrderInput {
    return {
        customerName: data.nombre,
        customerPhone: data.telefono,
        customerEmail: data.correo,
        restaurantId,
        products: data.productos.map(p => ({
            // Para GraphQL, necesitamos el ID original
            // Si p.id es un hash numérico, necesitamos encontrar el ID original
            // Por ahora, asumimos que p.id es el hash numérico y lo convertimos a string
            // En el futuro, esto debería buscar el ID original basado en el hash
            id: p.id.toString(), // Convertir hash numérico a string para GraphQL
            quantity: p.cantidad,
            price: p.precio
        })),
        total: data.total,
        paymentMethod: data.metodo_pago,
        deliveryMethod: data.modalidad_entrega,
        mesa: data.mesa,
        deliveryAddress: data.direccion
    };
}

/**
 * Convierte datos de pedido legacy al formato GraphQL con búsqueda de IDs originales
 */
export function convertLegacyOrderDataToGraphQLWithOriginalIds(
    data: LegacyCreateOrderData,
    products: LegacyProduct[],
    restaurantId: string = 'ay-wey'
): CreateOrderInput {
    return {
        customerName: data.nombre,
        customerPhone: data.telefono,
        customerEmail: data.correo,
        restaurantId,
        products: data.productos.map(p => {
            // Buscar el producto por hash numérico para obtener el ID original
            const product = products.find(prod => prod.id === p.id);
            const originalId = product?.originalId;

            return {
                id: originalId || p.id.toString(), // Usar ID original si existe, sino el hash como string
                quantity: p.cantidad,
                price: p.precio
            };
        }),
        total: data.total,
        paymentMethod: data.metodo_pago,
        deliveryMethod: data.modalidad_entrega,
        mesa: data.mesa,
        deliveryAddress: data.direccion
    };
}

/**
 * Genera un ID numérico único basado en un string
 */
export function generateNumericId(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convertir a 32-bit integer
    }
    return Math.abs(hash);
}

/**
 * Encuentra el ID original de GraphQL basado en el ID numérico
 */
export function findOriginalId(products: Product[], numericId: number): string | null {
    const product = products.find(p => generateNumericId(p.id) === numericId);
    return product ? product.id : null;
}

// ===================================================================
// CONSTANTES
// ===================================================================

export const ORDER_STATUSES = {
    PENDING: 'pending',
    PREPARING: 'preparing',
    READY: 'ready',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled'
} as const;

export const PAYMENT_METHODS = {
    CASH: 'cash',
    CARD: 'card',
    TRANSFER: 'transfer'
} as const;

export const DELIVERY_METHODS = {
    DELIVERY: 'delivery',
    PICKUP: 'pickup',
    DINE_IN: 'dine_in'
} as const;

export type OrderStatus = typeof ORDER_STATUSES[keyof typeof ORDER_STATUSES];
export type PaymentMethod = typeof PAYMENT_METHODS[keyof typeof PAYMENT_METHODS];
export type DeliveryMethod = typeof DELIVERY_METHODS[keyof typeof DELIVERY_METHODS]; 