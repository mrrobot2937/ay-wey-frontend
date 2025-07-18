#!/bin/bash

echo "🔄 Reiniciando el backend para aplicar los cambios..."

# Navegar al directorio del backend
cd ../choripam-backend-real

# Detener el servidor si está corriendo (si usas uvicorn)
echo "🛑 Deteniendo servidor anterior..."
pkill -f "uvicorn" || true
pkill -f "python.*main.py" || true

# Esperar un momento
sleep 2

# Reiniciar el servidor
echo "🚀 Iniciando servidor backend..."
python main.py &

# Esperar a que el servidor esté listo
echo "⏳ Esperando a que el servidor esté listo..."
sleep 5

echo "✅ Backend reiniciado. Los cambios deberían estar activos ahora."
echo "💡 Prueba la consulta getProducts desde el frontend para verificar que las imágenes de las variantes aparecen." 