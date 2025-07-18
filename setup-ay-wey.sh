#!/bin/bash

echo "🚀 Configurando proyecto Ay Wey..."

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

# Limpiar cache de Next.js
echo "🧹 Limpiando cache..."
rm -rf .next

# Crear archivo .env.local si no existe
if [ ! -f .env.local ]; then
    echo "📝 Creando archivo .env.local..."
    cat > .env.local << EOF
# Configuración para Ay Wey
NEXT_PUBLIC_GRAPHQL_URL=https://choripam-backend-real.vercel.app/graphql
NEXT_PUBLIC_APP_URL=http://localhost:3001
NEXT_PUBLIC_ENVIRONMENT=development
NEXT_PUBLIC_DEBUG_MODE=true
EOF
    echo "✅ Archivo .env.local creado"
fi

# Verificar que el backend esté disponible
echo "🔍 Verificando conexión con el backend..."
curl -s -o /dev/null -w "%{http_code}" https://choripam-backend-real.vercel.app/graphql

if [ $? -eq 0 ]; then
    echo "✅ Backend disponible"
else
    echo "⚠️ No se pudo verificar el backend"
fi

echo ""
echo "🎉 Configuración completada!"
echo ""
echo "�� Próximos pasos:"
echo "1. Ejecuta: npm run dev"
echo "2. Abre: http://localhost:3001"
echo "3. El proyecto está configurado para el restaurante 'ay-wey'"
echo ""
echo "💡 Notas:"
echo "- El proyecto usa el puerto 3001 para evitar conflictos"
echo "- Se conecta al mismo backend que ChoriPam"
echo "- Los datos son específicos para el restaurante 'ay-wey'"
echo ""
