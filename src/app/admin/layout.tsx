"use client";
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useClientSide } from '../../hooks/useClientSide';
import { AdminLoadingSpinner } from '../../components/LoadingSpinner';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  restaurant_name: string;
  restaurant_id: string;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const mounted = useClientSide();
  const router = useRouter();
  const pathname = usePathname();

  // Verificar autenticación al cargar (sin llamada a API)
  useEffect(() => {
    if (!mounted) return;

    const checkAuth = () => {
      try {
        const token = localStorage.getItem('admin_token');
        const adminData = localStorage.getItem('admin_user');
        
        if (!token || !adminData) {
          // No hay token o datos de usuario
          if (pathname !== '/admin/login' && pathname !== '/admin/signup') {
            router.push('/admin/login');
          }
          setLoading(false);
          return;
        }

        // Usar datos almacenados localmente
        const userData = JSON.parse(adminData);
        setAdminUser(userData);
      } catch (error) {
        console.error('Error parseando datos de usuario:', error);
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        if (pathname !== '/admin/login' && pathname !== '/admin/signup') {
          router.push('/admin/login');
        }
      }

      setLoading(false);
    };

    checkAuth();
  }, [pathname, router, mounted]);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setAdminUser(null);
    router.push('/admin/login');
  };

  // Evitar renderizado hasta que esté montado
  if (!mounted) {
    return <AdminLoadingSpinner />;
  }

  // Mostrar spinner mientras carga
  if (loading) {
    return <AdminLoadingSpinner />;
  }

  // Mostrar página de auth sin layout
  if (!adminUser && (pathname === '/admin/login' || pathname === '/admin/signup')) {
    return <div className="min-h-screen bg-gray-900">{children}</div>;
  }

  // Redirigir si no está autenticado
  if (!adminUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-gray-800 shadow-lg">
        {/* Logo y info del restaurante */}
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-center h-16 bg-yellow-600">
            <h1 className="text-xl font-bold text-black">Admin Panel</h1>
          </div>
          
          {/* Info del usuario */}
          <div className="p-4 border-b border-gray-700">
            <p className="text-sm text-gray-300">Restaurante</p>
            <p className="font-semibold text-yellow-400">{adminUser.restaurant_name}</p>
            <p className="text-xs text-gray-400 mt-1">{adminUser.name}</p>
          </div>

          {/* Navegación */}
          <nav className="flex-1 p-4 space-y-2">
            <Link
              href="/admin/dashboard"
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                pathname === '/admin/dashboard' 
                  ? 'bg-yellow-600 text-black' 
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <span className="mr-3">📊</span>
              Dashboard
            </Link>
            
            <Link
              href="/admin/orders"
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                pathname.startsWith('/admin/orders') 
                  ? 'bg-yellow-600 text-black' 
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <span className="mr-3">📋</span>
              Órdenes
            </Link>

            {/*
            <Link
              href="/admin/orders/mesa"
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ml-4 ${
                pathname === '/admin/orders/mesa' 
                  ? 'bg-yellow-500 text-black' 
                  : 'text-gray-400 hover:bg-gray-700'
              }`}
            >
              <span className="mr-3">🪑</span>
              Mesas
            </Link>

            <Link
              href="/admin/orders/domicilio"
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ml-4 ${
                pathname === '/admin/orders/domicilio' 
                  ? 'bg-yellow-500 text-black' 
                  : 'text-gray-400 hover:bg-gray-700'
              }`}
            >
              <span className="mr-3">🚚</span>
              Domicilios
            </Link>

            <Link
              href="/admin/orders/recoger"
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ml-4 ${
                pathname === '/admin/orders/recoger' 
                  ? 'bg-yellow-500 text-black' 
                  : 'text-gray-400 hover:bg-gray-700'
              }`}
            >
              <span className="mr-3">🏪</span>
              Para Recoger
            </Link>
            */}

            <Link
              href="/admin/products"
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                pathname === '/admin/products' 
                  ? 'bg-yellow-600 text-black' 
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <span className="mr-3">🍽️</span>
              Productos
            </Link>

            {/*
            <Link
              href="/admin/analytics"
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                pathname === '/admin/analytics' 
                  ? 'bg-yellow-600 text-black' 
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <span className="mr-3">📈</span>
              Analytics
            </Link>
            */}
          </nav>

          {/* Botón de logout */}
          <div className="p-4 border-t border-gray-700">
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-2 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <span className="mr-3">🚪</span>
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="ml-64">
        {/* Header superior */}
        <header className="bg-gray-800 shadow-sm h-16 flex items-center justify-between px-6">
          <h2 className="text-xl font-semibold text-yellow-400">
            {pathname === '/admin/dashboard' && 'Dashboard Ay Wey'}
            {pathname === '/admin/orders' && 'Todas las Órdenes'}
            {/*
            {pathname === '/admin/orders/mesa' && 'Órdenes de Mesa'}
            {pathname === '/admin/orders/domicilio' && 'Órdenes de Domicilio'}
            {pathname === '/admin/orders/recoger' && 'Órdenes para Recoger'}
            */}
            {pathname === '/admin/products' && 'Gestión de Productos'}
            {/* {pathname === '/admin/analytics' && 'Analytics'} */}
          </h2>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-400">
              {new Date().toLocaleDateString('es-CO', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
          </div>
        </header>

        {/* Contenido de la página */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
} 