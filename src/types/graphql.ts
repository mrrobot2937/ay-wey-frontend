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
    paymentMethod: PaymentMethod;
    deliveryMethod: DeliveryMethod;
    mesa?: string;
    deliveryAddress?: string;
    status: OrderStatus;
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
// TIPOS ENUM (como uniones de strings)
// ===================================================================

export type OrderStatus =
    | 'PENDING'
    | 'CONFIRMED'
    | 'PREPARING'
    | 'READY'
    | 'DELIVERED'
    | 'CANCELLED';

export type PaymentMethod = 'CASH' | 'TRANSFER';

export type DeliveryMethod = 'DINE_IN' | 'PICKUP' | 'DELIVERY';

// ===================================================================
// UTILIDADES
// ===================================================================

/**
 * Genera un ID numérico único basado en el hash de un string
 */
export function generateNumericId(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convertir a entero de 32bit
    }
    return Math.abs(hash);
} 