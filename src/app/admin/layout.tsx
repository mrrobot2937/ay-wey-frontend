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
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    return <div className="min-h-screen bg-white">{children}</div>;
  }

  // Redirigir si no está autenticado
  if (!adminUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Sidebar para desktop y drawer para móvil */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-30 md:hidden" onClick={() => setSidebarOpen(false)}></div>
      )}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-200 md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 md:block`}>
        {/* Logo y info del restaurante */}
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-center h-16 bg-white border-b border-gray-200">
            <h1 className="text-xl font-bold text-yellow-500">Admin Panel</h1>
          </div>
          {/* Info del usuario */}
          <div className="p-4 border-b border-gray-200">
            <p className="text-sm text-gray-500">Restaurante</p>
            <p className="font-semibold text-yellow-500">{adminUser.restaurant_name}</p>
            <p className="text-xs text-gray-400 mt-1">{adminUser.name}</p>
          </div>
          {/* Navegación */}
          <nav className="flex-1 p-4 space-y-2">
            <Link
              href="/admin/dashboard"
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                pathname === '/admin/dashboard' 
                  ? 'bg-yellow-100 text-yellow-700' 
                  : 'text-gray-700 hover:bg-yellow-50'
              }`}
            >
              <span className="mr-3">📊</span>
              Dashboard
            </Link>
            <Link
              href="/admin/orders"
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                pathname.startsWith('/admin/orders') 
                  ? 'bg-yellow-100 text-yellow-700' 
                  : 'text-gray-700 hover:bg-yellow-50'
              }`}
            >
              <span className="mr-3">📋</span>
              Órdenes
            </Link>
            <Link
              href="/admin/products"
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                pathname === '/admin/products' 
                  ? 'bg-yellow-100 text-yellow-700' 
                  : 'text-gray-700 hover:bg-yellow-50'
              }`}
            >
              <span className="mr-3">🍽️</span>
              Productos
            </Link>
          </nav>
          {/* Botón de logout */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-2 text-gray-700 hover:bg-yellow-50 rounded-lg transition-colors"
            >
              <span className="mr-3">🔒</span>
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
      {/* Contenido principal */}
      <div className="md:ml-64 min-h-screen">
        {/* Header superior */}
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-4 md:px-6 border-b border-gray-200 sticky top-0 z-30">
          <div className="flex items-center gap-2">
            {/* Botón hamburguesa para móvil */}
            <button
              className="md:hidden p-2 rounded hover:bg-yellow-50 focus:outline-none"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Abrir menú"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <h2 className="text-xl font-semibold text-yellow-500">
              {pathname === '/admin/dashboard' && 'Dashboard Ay Wey'}
              {pathname === '/admin/orders' && 'Todas las Órdenes'}
              {pathname === '/admin/products' && 'Gestión de Productos'}
            </h2>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">
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
        <main className="p-2 sm:p-4 md:p-6 max-w-4xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
} 