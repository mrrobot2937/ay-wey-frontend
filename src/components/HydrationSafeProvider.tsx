'use client';

import { useEffect, useState, ReactNode } from 'react';

interface HydrationSafeProviderProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Componente que evita errores de hidratación
 * Solo renderiza el contenido después de que el componente esté montado en el cliente
 */
export function HydrationSafeProvider({ 
  children, 
  fallback = <div className="min-h-screen bg-black flex items-center justify-center">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-400"></div>
  </div>
}: HydrationSafeProviderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export default HydrationSafeProvider; 