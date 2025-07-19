import { gql } from '@apollo/client';

// ===================================================================
// FRAGMENTS (para reutilizar estructuras comunes)
// ===================================================================

export const PRODUCT_FRAGMENT = gql`
  fragment ProductFields on Product {
    id
    name
    description
    price
    imageUrl
    available
    preparationTime
    restaurantId
    category {
      id
      name
      description
    }
    variants {
      size
      price
      imageUrl
    }
  }
`;

export const ORDER_FRAGMENT = gql`
  fragment OrderFields on Order {
    id
    restaurantId
    total
    status
    paymentMethod
    deliveryMethod
    mesa
    deliveryAddress
    createdAt
    updatedAt
    customer {
      name
      phone
      email
    }
    products {
      id
      name
      quantity
      price
      total
    }
  }
`;

export const CATEGORY_FRAGMENT = gql`
  fragment CategoryFields on Category {
    id
    name
    description
  }
`;

// ===================================================================
// QUERIES
// ===================================================================

// Obtener productos
export const GET_PRODUCTS = gql`
  ${PRODUCT_FRAGMENT}
  query GetProducts($restaurantId: String!) {
    products(restaurantId: $restaurantId) {
      ...ProductFields
    }
  }
`;

// Obtener productos por categoría
export const GET_PRODUCTS_BY_CATEGORY = gql`
  ${PRODUCT_FRAGMENT}
  query GetProductsByCategory($restaurantId: String!, $categoryId: String!) {
    productsByCategory(restaurantId: $restaurantId, categoryId: $categoryId) {
      ...ProductFields
    }
  }
`;

// Obtener un producto específico
export const GET_PRODUCT = gql`
  ${PRODUCT_FRAGMENT}
  query GetProduct($productId: String!) {
    product(productId: $productId) {
      ...ProductFields
    }
  }
`;

// Buscar productos
export const SEARCH_PRODUCTS = gql`
  ${PRODUCT_FRAGMENT}
  query SearchProducts($restaurantId: String!, $searchTerm: String!) {
    searchProducts(restaurantId: $restaurantId, searchTerm: $searchTerm) {
      ...ProductFields
    }
  }
`;

// Obtener productos disponibles
export const GET_AVAILABLE_PRODUCTS = gql`
  ${PRODUCT_FRAGMENT}
  query GetAvailableProducts($restaurantId: String!) {
    availableProducts(restaurantId: $restaurantId) {
      ...ProductFields
    }
  }
`;

// Obtener categorías
export const GET_CATEGORIES = gql`
  ${CATEGORY_FRAGMENT}
  query GetCategories($restaurantId: String!) {
    categories(restaurantId: $restaurantId) {
      ...CategoryFields
    }
  }
`;

// Obtener pedidos
export const GET_ORDERS = gql`
  ${ORDER_FRAGMENT}
  query GetOrders($restaurantId: String!, $status: String, $limit: Int) {
    orders(restaurantId: $restaurantId, status: $status, limit: $limit) {
      ...OrderFields
    }
  }
`;

// Obtener un pedido específico
export const GET_ORDER = gql`
  ${ORDER_FRAGMENT}
  query GetOrder($orderId: String!) {
    order(orderId: $orderId) {
      ...OrderFields
    }
  }
`;

// Query específica para el hook useOrders, para evitar conflictos
export const GET_ORDERS_BY_RESTAURANT = gql`
  ${ORDER_FRAGMENT}
  query GetOrdersByRestaurant($restaurantId: String!) {
    orders(restaurantId: $restaurantId) {
      ...OrderFields
    }
  }
`;

// Obtener estadísticas del restaurante
export const GET_RESTAURANT_STATS = gql`
  query GetRestaurantStats($restaurantId: String!) {
    restaurantStats(restaurantId: $restaurantId) {
      restaurantId
      totalOrders
      totalRevenue
      pendingOrders
      preparingOrders
      statusBreakdown
    }
  }
`;

// ===================================================================
// MUTATIONS
// ===================================================================

// Crear producto
export const CREATE_PRODUCT = gql`
  mutation CreateProduct($input: CreateProductInput!) {
    createProduct(productInput: $input) {
      success
      message
      id
    }
  }
`;

// Actualizar producto
export const UPDATE_PRODUCT = gql`
  mutation UpdateProduct($productId: String!, $input: UpdateProductInput!) {
    updateProduct(productId: $productId, productInput: $input) {
      success
      message
      id
    }
  }
`;

// Eliminar producto
export const DELETE_PRODUCT = gql`
  mutation DeleteProduct($productId: String!) {
    deleteProduct(productId: $productId) {
      success
      message
    }
  }
`;

// Crear categoría
export const CREATE_CATEGORY = gql`
  mutation CreateCategory($input: CreateCategoryInput!) {
    createCategory(categoryInput: $input) {
      success
      message
      id
    }
  }
`;

// Crear pedido
export const CREATE_ORDER = gql`
  mutation CreateOrder($input: CreateOrderInput!) {
    createOrder(orderInput: $input) {
      success
      message
      id
    }
  }
`;

// Actualizar estado del pedido
export const UPDATE_ORDER_STATUS = gql`
  mutation UpdateOrderStatus($orderId: String!, $status: String!, $restaurantId: String!) {
    updateOrderStatus(orderId: $orderId, status: $status, restaurantId: $restaurantId) {
      success
      message
    }
  }
`;

export const ADD_PRODUCT_TO_ORDER = gql`
    mutation AddProductToOrder($orderId: String!, $productId: String!, $quantity: Int!, $restaurantId: String!) {
        addProductToOrder(orderId: $orderId, productId: $productId, quantity: $quantity, restaurantId: $restaurantId) {
            success
            message
            order {
                id
                total
                products {
                    id
                    name
                    quantity
                    price
                }
            }
        }
    }
`;

// Eliminar pedido
export const DELETE_ORDER = gql`
  mutation DeleteOrder($orderId: String!) {
    deleteOrder(orderId: $orderId) {
      success
      message
    }
  }
`;

// Actualizar disponibilidad de productos en lote
export const BULK_UPDATE_PRODUCT_AVAILABILITY = gql`
  mutation BulkUpdateProductAvailability($productIds: [String!]!, $available: Boolean!) {
    bulkUpdateProductAvailability(productIds: $productIds, available: $available) {
      success
      message
    }
  }
`;

// ===================================================================
// SUBSCRIPTIONS (para futuras implementaciones en tiempo real)
// ===================================================================

// Suscripción a cambios de pedidos (para implementar más adelante)
export const ORDER_UPDATES = gql`
  subscription OrderUpdates($restaurantId: String!) {
    orderUpdates(restaurantId: $restaurantId) {
      ...OrderFields
    }
  }
`;

// ===================================================================
// TIPOS TYPESCRIPT PARA LAS VARIABLES DE LAS QUERIES
// ===================================================================

// Variables para queries
export interface GetProductsVariables {
  restaurantId: string;
}

export interface GetProductsByCategory {
  restaurantId: string;
  categoryId: string;
}

export interface GetProductVariables {
  productId: string;
}

export interface SearchProductsVariables {
  restaurantId: string;
  searchTerm: string;
}

export interface GetOrdersVariables {
  restaurantId: string;
  status?: string;
  limit?: number;
}

export interface GetOrderVariables {
  orderId: string;
}

export interface GetRestaurantStatsVariables {
  restaurantId: string;
}

// Variables para mutations
export interface CreateProductVariables {
  input: {
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
    }>;
  };
}

export interface UpdateProductVariables {
  productId: string;
  input: {
    name?: string;
    description?: string;
    price?: number;
    imageUrl?: string;
    available?: boolean;
    categoryId?: string;
    variants?: Array<{
      size: string;
      price: number;
    }>;
  };
}

export interface DeleteProductVariables {
  productId: string;
}

export interface CreateCategoryVariables {
  input: {
    name: string;
    description?: string;
    restaurantId: string;
  };
}

export interface CreateOrderVariables {
  input: {
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    restaurantId: string;
    products: Array<{
      id: string;
      quantity: number;
      price: number;
    }>;
    total: number;
    paymentMethod: string;
    deliveryMethod: string;
    mesa?: string;
    deliveryAddress?: string;
  };
}

export interface UpdateOrderStatusVariables {
  orderId: string;
  status: string;
}

export interface DeleteOrderVariables {
  orderId: string;
}

export interface BulkUpdateProductAvailabilityVariables {
  productIds: string[];
  available: boolean;
} 