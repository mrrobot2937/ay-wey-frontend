import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'yellow' | 'white' | 'gray';
  className?: string;
}

export default function LoadingSpinner({ 
  size = 'lg', 
  color = 'yellow',
  className = ''
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-16 w-16',
    lg: 'h-32 w-32',
    xl: 'h-48 w-48'
  };

  const colorClasses = {
    yellow: 'border-yellow-400',
    white: 'border-white',
    gray: 'border-gray-400'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div 
        className={`animate-spin rounded-full border-b-2 ${sizeClasses[size]} ${colorClasses[color]}`}
        role="status"
        aria-label="Cargando..."
      >
        <span className="sr-only">Cargando...</span>
      </div>
    </div>
  );
}

// Componente específico para el layout del admin
export function AdminLoadingSpinner() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <LoadingSpinner size="xl" color="yellow" />
    </div>
  );
} 