#!/bin/bash

echo "🚀 Migrando Frontend de Ay Wey a GraphQL..."
echo "=============================================="

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: Este script debe ejecutarse desde la raíz del proyecto frontend"
    echo "   Asegúrate de estar en: /home/sam/Desktop/mazorca/mazorca-food/choripam-repo/ay-wey-frontend"
    exit 1
fi

echo "📦 Paso 1: Instalando dependencias de Apollo Client..."
npm install @apollo/client@^3.8.7 graphql@^16.8.1

if [ $? -ne 0 ]; then
    echo "❌ Error instalando dependencias"
    exit 1
fi

echo "✅ Dependencias instaladas exitosamente"

echo ""
echo "🔧 Paso 2: Configurando variables de entorno..."

# Crear archivo .env.local si no existe
if [ ! -f ".env.local" ]; then
    cat > .env.local << EOF
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
EOF
    echo "✅ Archivo .env.local creado"
else
    echo "⚠️  Archivo .env.local ya existe, verificando configuración..."
    
    # Verificar si tiene la configuración de GraphQL
    if ! grep -q "NEXT_PUBLIC_GRAPHQL_URL" .env.local; then
        echo "" >> .env.local
        echo "# GraphQL Backend Configuration" >> .env.local
        echo "NEXT_PUBLIC_GRAPHQL_URL=http://localhost:8000/graphql" >> .env.local
        echo "NEXT_PUBLIC_USE_GRAPHQL=true" >> .env.local
        echo "✅ Configuración GraphQL agregada a .env.local"
    else
        echo "✅ Configuración GraphQL ya presente"
    fi
fi

echo ""
echo "🔍 Paso 3: Verificando archivos necesarios..."

# Lista de archivos que deben existir
required_files=(
    "src/lib/apollo-client.ts"
    "src/graphql/queries.ts"
    "src/types/graphql.ts"
    "src/services/graphql-api.ts"
    "src/services/api-service.ts"
    "src/components/ApolloProvider.tsx"
)

missing_files=()

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file (FALTANTE)"
        missing_files+=("$file")
    fi
done

if [ ${#missing_files[@]} -gt 0 ]; then
    echo ""
    echo "⚠️  Archivos faltantes detectados:"
    for file in "${missing_files[@]}"; do
        echo "   - $file"
    done
    echo ""
    echo "💡 Estos archivos fueron creados durante la configuración."
    echo "   Si faltan, verifica que se hayan copiado correctamente."
fi

echo ""
echo "🔍 Paso 4: Verificando backend GraphQL..."

# Verificar si el backend está corriendo
if curl -s http://localhost:8000/graphql >/dev/null 2>&1; then
    echo "✅ Backend GraphQL está corriendo en http://localhost:8000"
else
    echo "⚠️  Backend GraphQL no está corriendo"
    echo ""
    echo "📋 Para iniciar el backend:"
    echo "   cd /home/sam/Desktop/mazorca/mazorca-food/choripam-backend-real"
    echo "   source venv/bin/activate"
    echo "   python main.py"
    echo ""
fi

echo ""
echo "🧪 Paso 5: Probando configuración..."

# Verificar que Node.js puede resolver los módulos
if node -e "require('@apollo/client')" 2>/dev/null; then
    echo "✅ Apollo Client instalado correctamente"
else
    echo "❌ Error: Apollo Client no se pudo importar"
    echo "💡 Intenta: npm install --force"
fi

if node -e "require('graphql')" 2>/dev/null; then
    echo "✅ GraphQL instalado correctamente"
else
    echo "❌ Error: GraphQL no se pudo importar"
    echo "💡 Intenta: npm install --force"
fi

echo ""
echo "📋 Paso 6: Instrucciones finales..."

echo ""
echo "🎯 Para completar la migración:"
echo ""
echo "1. 📁 Envolver la aplicación con ApolloProvider:"
echo "   Edita src/app/layout.tsx y agrega:"
echo ""
echo "   import { ApolloProvider } from '../components/ApolloProvider';"
echo ""
echo "   export default function RootLayout({ children }) {"
echo "     return ("
echo "       <html lang=\"es\">"
echo "         <body>"
echo "           <ApolloProvider>"
echo "             {children}"
echo "           </ApolloProvider>"
echo "         </body>"
echo "       </html>"
echo "     );"
echo "   }"
echo ""
echo "2. 🔄 Actualizar importaciones en componentes:"
echo "   Cambiar:"
echo "     import { apiService } from '../services/api';"
echo "   Por:"
echo "     import { apiService } from '../services/api-service';"
echo ""
echo "3. 🚀 Iniciar el servidor de desarrollo:"
echo "   npm run dev"
echo ""
echo "4. 🧪 Probar en el navegador:"
echo "   http://localhost:3000"
echo "   Verificar en la consola: '🔧 Usando GraphQL API service'"
echo ""

echo "================================================"
echo "✅ ¡Migración completada exitosamente!"
echo ""
echo "📚 Consulta MIGRATION_GUIDE.md para más detalles"
echo "🐛 Para troubleshooting, revisa la sección de problemas comunes"
echo ""
echo "🎉 Tu aplicación ahora usa GraphQL con Apollo Client!"
echo "================================================" 