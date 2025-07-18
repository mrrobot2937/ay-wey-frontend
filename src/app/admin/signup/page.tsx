"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminSignup() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    restaurant_name: '',
    restaurant_phone: '',
    restaurant_address: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(''); // Limpiar error al escribir
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return false;
    }
    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('https://ls01awdut1.execute-api.us-east-1.amazonaws.com/v1/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          restaurant_name: formData.restaurant_name,
          restaurant_phone: formData.restaurant_phone || formData.phone,
          restaurant_address: formData.restaurant_address
        })
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(true);
        // Guardar token y datos del usuario en localStorage
        localStorage.setItem('admin_token', result.token);
        localStorage.setItem('admin_user', JSON.stringify(result.admin));
        
        // Mostrar mensaje de éxito y redirigir
        setTimeout(() => {
          router.push('/admin/dashboard');
        }, 2000);
      } else {
        setError(result.error || 'Error al registrar administrador');
      }
    } catch (error) {
      console.error('Error de red:', error);
      setError('Error de conexión. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center">
          <div className="bg-green-600 text-white p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-2">¡Registro Exitoso!</h2>
            <p className="mb-4">Tu cuenta de administrador ha sido creada correctamente.</p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
            <p className="text-sm mt-2">Redirigiendo al dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo y título */}
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-yellow-400">
            Crear Cuenta Admin
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Registra tu restaurante y crea tu cuenta de administrador
          </p>
        </div>

        {/* Formulario */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Información Personal */}
            <div className="border-b border-gray-700 pb-4">
              <h3 className="text-lg font-medium text-yellow-400 mb-3">Información Personal</h3>
              
              <div className="space-y-3">
                <input
                  name="name"
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-600 placeholder-gray-400 text-white bg-gray-800 rounded-lg focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
                  placeholder="Nombre completo"
                  value={formData.name}
                  onChange={handleChange}
                />

                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="w-full px-3 py-2 border border-gray-600 placeholder-gray-400 text-white bg-gray-800 rounded-lg focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
                  placeholder="Email del administrador"
                  value={formData.email}
                  onChange={handleChange}
                />

                <input
                  name="phone"
                  type="tel"
                  required
                  className="w-full px-3 py-2 border border-gray-600 placeholder-gray-400 text-white bg-gray-800 rounded-lg focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
                  placeholder="Teléfono (ej: +573001234567)"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Contraseñas */}
            <div className="border-b border-gray-700 pb-4">
              <h3 className="text-lg font-medium text-yellow-400 mb-3">Contraseña</h3>
              
              <div className="space-y-3">
                <input
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="w-full px-3 py-2 border border-gray-600 placeholder-gray-400 text-white bg-gray-800 rounded-lg focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
                  placeholder="Contraseña (mínimo 6 caracteres)"
                  value={formData.password}
                  onChange={handleChange}
                />

                <input
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="w-full px-3 py-2 border border-gray-600 placeholder-gray-400 text-white bg-gray-800 rounded-lg focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
                  placeholder="Confirmar contraseña"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Información del Restaurante */}
            <div>
              <h3 className="text-lg font-medium text-yellow-400 mb-3">Información del Restaurante</h3>
              
              <div className="space-y-3">
                <input
                  name="restaurant_name"
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-600 placeholder-gray-400 text-white bg-gray-800 rounded-lg focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
                  placeholder="Nombre del restaurante"
                  value={formData.restaurant_name}
                  onChange={handleChange}
                />

                <input
                  name="restaurant_phone"
                  type="tel"
                  className="w-full px-3 py-2 border border-gray-600 placeholder-gray-400 text-white bg-gray-800 rounded-lg focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
                  placeholder="Teléfono del restaurante (opcional)"
                  value={formData.restaurant_phone}
                  onChange={handleChange}
                />

                <textarea
                  name="restaurant_address"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-600 placeholder-gray-400 text-white bg-gray-800 rounded-lg focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm resize-none"
                  placeholder="Dirección del restaurante"
                  value={formData.restaurant_address}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-600 text-white p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Botón submit */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-black bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                  Creando cuenta...
                </div>
              ) : (
                'Crear Cuenta de Administrador'
              )}
            </button>
          </div>

          {/* Link a login */}
          <div className="text-center">
            <p className="text-sm text-gray-400">
              ¿Ya tienes cuenta?{' '}
              <Link
                href="/admin/login"
                className="font-medium text-yellow-400 hover:text-yellow-300"
              >
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
} 