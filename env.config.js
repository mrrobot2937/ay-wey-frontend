// Configuración de entorno para el frontend
const config = {
  // URL del backend GraphQL - Forzado a producción
  GRAPHQL_URL: 'https://choripam-backend-real.vercel.app/graphql',
  
  // Configuración de desarrollo
  DEBUG_MODE: process.env.NEXT_PUBLIC_DEBUG_MODE === 'true',
  ENVIRONMENT: process.env.NEXT_PUBLIC_ENVIRONMENT || 'development',
  
  // Configuración del restaurante
  DEFAULT_RESTAURANT_ID: 'ay-wey',
  
  // URLs de la aplicación
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  
  // Configuración de cache
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutos en milisegundos
};

export default config; 