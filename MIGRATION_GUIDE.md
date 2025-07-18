# 🔄 Guía de Migración: REST a GraphQL

Esta guía te ayudará a migrar el frontend de Ay Wey de REST API a GraphQL usando Apollo Client.

## 📋 Pasos de Integración

### 1. Instalar Dependencias

```bash
cd /home/sam/Desktop/mazorca/mazorca-food/choripam-repo/ay-wey-frontend
npm install @apollo/client@^3.8.7 graphql@^16.8.1
```

### 2. Configurar Variables de Entorno

Crea el archivo `.env.local` en la raíz del proyecto:

```env
# GraphQL Backend Configuration
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:8000/graphql
NEXT_PUBLIC_USE_GRAPHQL=true

# REST API Configuration (backup)
NEXT_PUBLIC_REST_API_URL=https://totcw75uzb.execute-api.us-east-1.amazonaws.com/v1

# Restaurant Configuration
NEXT_PUBLIC_RESTAURANT_ID=ay-wey

# Development Settings
NODE_ENV=development
NEXT_PUBLIC_DEBUG=true
```

### 3. Envolver la Aplicación con Apollo Provider

Edita `src/app/layout.tsx` (o tu archivo principal):

```tsx
import { ApolloProvider } from '../components/ApolloProvider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <ApolloProvider>
          {children}
        </ApolloProvider>
      </body>
    </html>
  );
}
```

### 4. Actualizar Importaciones de API

**Antes (REST):**
```tsx
import { apiService } from '../services/api';
```

**Después (GraphQL con compatibilidad REST):**
```tsx
import { apiService } from '../services/api-service';
```

### 5. Verificar que el Backend GraphQL esté Corriendo

```bash
# En la terminal del backend
cd /home/sam/Desktop/mazorca/mazorca-food/ay-wey-backend
source venv/bin/activate
python main.py
```

El servidor debe estar corriendo en `http://localhost:8000`

### 6. Probar la Integración

```bash
# En la terminal del frontend
npm run dev
```

El frontend debe estar corriendo en `http://localhost:3000`

## 🔧 Configuración de Apollo Client

### Características Implementadas:

- **Cache Inteligente**: Los productos y pedidos se cachean por `restaurantId`
- **Manejo de Errores**: Logs detallados de errores GraphQL y de red
- **Retry Logic**: Reintentos automáticos en errores 500
- **Compatibilidad**: El API service mantiene la misma interfaz

### Políticas de Cache:

```typescript
typePolicies: {
  Query: {
    fields: {
      products: {
        keyArgs: ["restaurantId"], // Cache por restaurante
      },
      orders: {
        keyArgs: ["restaurantId", "status"], // Cache por restaurante y estado
      },
    },
  },
}
```

## 🔄 Migración Gradual

### Opción 1: Migración Completa (Recomendada)
Usar solo GraphQL desde el inicio:

```typescript
// En .env.local
NEXT_PUBLIC_USE_GRAPHQL=true
```

### Opción 2: Migración por Componentes
Migrar componente por componente:

```typescript
// En un componente específico
import { graphqlApiService } from '../services/graphql-api';

// Usar directamente el servicio GraphQL
const products = await graphqlApiService.getProducts('choripam');
```

### Opción 3: Alternar Dinámicamente
```typescript
import { apiService } from '../services/api-service';

// Cambiar entre servicios en runtime
apiService.switchToGraphQL(); // o switchToREST()
console.log('Usando:', apiService.getCurrentService());
```

## 📊 Características Principales

### ✅ Queries Implementadas:
- `getProducts()` - Obtener productos
- `getProduct(id)` - Obtener producto específico
- `getCategories()` - Obtener categorías
- `getOrders()` - Obtener pedidos
- `getRestaurantStats()` - Estadísticas del restaurante
- `searchProducts()` - Buscar productos
- `getAvailableProducts()` - Productos disponibles

### ✅ Mutations Implementadas:
- `createProduct()` - Crear producto
- `updateProduct()` - Actualizar producto
- `deleteProduct()` - Eliminar producto
- `createOrder()` - Crear pedido
- `updateOrderStatus()` - Actualizar estado de pedido

### ✅ Compatibilidad:
- **IDs**: Conversión automática entre IDs string (GraphQL) y números (frontend)
- **Campos**: Conversión automática entre camelCase (GraphQL) y snake_case (frontend)
- **Datos**: Mantiene el mismo formato de respuesta que la API REST

## 🧪 Testing

### Probar GraphQL Backend:
```bash
cd /home/sam/Desktop/mazorca/mazorca-food/choripam-backend-real
source venv/bin/activate
python test_all_operations.py
```

### Probar Frontend:
1. Navegar a `http://localhost:3000`
2. Abrir DevTools → Console
3. Verificar logs: `🔧 Usando GraphQL API service`
4. Probar funcionalidades (crear producto, hacer pedido, etc.)

### Probar Apollo DevTools:
1. Instalar [Apollo Client DevTools](https://chrome.google.com/webstore/detail/apollo-client-devtools/)
2. Abrir DevTools → Apollo tab
3. Ver queries, cache y mutaciones en tiempo real

## 🚨 Troubleshooting

### Problema: "Cannot find module '@apollo/client'"
```bash
npm install @apollo/client graphql
```

### Problema: "Network error"
- Verificar que el backend GraphQL esté corriendo en puerto 8000
- Verificar la URL en `.env.local`
- Revisar configuración de CORS en el backend

### Problema: "GraphQL errors"
- Revisar logs en la consola del browser
- Verificar que las queries coincidan con el schema del backend
- Usar Apollo DevTools para debuggear

### Problema: "IDs no coinciden"
- Los IDs se convierten automáticamente entre string (GraphQL) y number (frontend)
- Verificar que `originalId` esté siendo usado correctamente

## 📈 Ventajas de GraphQL

### 🚀 Performance:
- **Cache Inteligente**: Apollo Client cachea automáticamente
- **Queries Específicas**: Solo se solicitan los campos necesarios
- **Batch Requests**: Múltiples queries en una sola request

### 🛠️ Developer Experience:
- **Type Safety**: TypeScript completo
- **IntelliSense**: Autocompletado de queries
- **DevTools**: Debugging avanzado
- **Real-time**: Soporte para subscriptions (futuro)

### 🔧 Mantenimiento:
- **Single Endpoint**: Un solo endpoint GraphQL
- **Versionado**: Evolución del schema sin breaking changes
- **Documentación**: Schema autodocumentado

## 🎯 Próximos Pasos

1. **✅ Completado**: Backend GraphQL funcional
2. **✅ Completado**: Frontend con Apollo Client
3. **🔄 En Progreso**: Migración completa del frontend
4. **📋 Pendiente**: Subscriptions en tiempo real
5. **📋 Pendiente**: Optimistic UI updates
6. **📋 Pendiente**: Offline support

## 📚 Recursos

- [Apollo Client Docs](https://www.apollographql.com/docs/react/)
- [GraphQL Best Practices](https://graphql.org/learn/best-practices/)
- [Next.js + Apollo](https://nextjs.org/learn/excel/adding-search-to-your-app)

---

**¡La migración está lista! 🎉**

El sistema ahora puede funcionar con GraphQL manteniendo compatibilidad completa con el código existente. 