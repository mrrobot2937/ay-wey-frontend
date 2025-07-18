"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Credenciales de demo
const DEMO_CREDENTIALS = {
  email: 'admin@ay-wey.com',
  password: 'demo123',
  adminData: {
    id: 'admin-1',
          name: 'Administrador Ay Wey',
          email: 'admin@ay-wey.com',
      restaurant_name: 'Ay Wey',
            restaurant_id: 'ay-wey'
  }
};

export default function AdminLogin() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(''); // Limpiar error al escribir
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Validar credenciales
      if (formData.email === DEMO_CREDENTIALS.email && formData.password === DEMO_CREDENTIALS.password) {
        // Generar token simple
        const token = `demo-token-${Date.now()}`;
        
        // Guardar token y datos del usuario en localStorage
        localStorage.setItem('admin_token', token);
        localStorage.setItem('admin_user', JSON.stringify(DEMO_CREDENTIALS.adminData));
        
        // Redirigir al dashboard
        router.push('/admin/dashboard');
      } else {
        setError('Credenciales incorrectas. Usa las credenciales de demo.');
      }
    } catch (error) {
      console.error('Error de autenticación:', error);
      setError('Error de conexión. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo y título */}
        <div className="text-center">
          <div className="text-6xl mb-4">🍽️</div>
          <h2 className="mt-6 text-3xl font-extrabold text-yellow-400">
            Admin Panel
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Inicia sesión para gestionar tu restaurante
          </p>
        </div>

        {/* Formulario */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="relative block w-full px-3 py-2 border border-gray-600 placeholder-gray-400 text-white bg-gray-800 rounded-lg focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 focus:z-10 sm:text-sm"
                placeholder="Email del administrador"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            {/* Contraseña */}
            <div>
              <label htmlFor="password" className="sr-only">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="relative block w-full px-3 py-2 border border-gray-600 placeholder-gray-400 text-white bg-gray-800 rounded-lg focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 focus:z-10 sm:text-sm"
                placeholder="Contraseña"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-600 text-white p-3 rounded-lg text-sm flex items-center gap-2">
              <span>❌</span>
              {error}
            </div>
          )}

          {/* Botón submit */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-black bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                  Iniciando sesión...
                </div>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </div>

          {/* Link a registro */}
          <div className="text-center">
            <p className="text-sm text-gray-400">
              ¿No tienes cuenta?{' '}
              <Link
                href="/admin/signup"
                className="font-medium text-yellow-400 hover:text-yellow-300"
              >
                Regístrate aquí
              </Link>
            </p>
          </div>
        </form>

        {/* Demo credentials */}
        <div className="mt-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
          <h3 className="text-sm font-medium text-yellow-400 mb-2">🔑 Credenciales de demo:</h3>
          <div className="space-y-1">
            <p className="text-xs text-gray-300">
              <strong>Email:</strong> admin@ay-wey.com
            </p>
            <p className="text-xs text-gray-300">
              <strong>Password:</strong> demo123
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setFormData({
                email: DEMO_CREDENTIALS.email,
                password: DEMO_CREDENTIALS.password
              });
            }}
            className="mt-2 text-xs text-yellow-400 hover:text-yellow-300 underline"
          >
            Usar credenciales de demo
          </button>
        </div>
      </div>
    </div>
  );
} 