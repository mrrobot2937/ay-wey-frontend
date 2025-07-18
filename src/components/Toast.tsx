'use client';

import { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose: () => void;
}

export function Toast({ message, type, duration = 5000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Tiempo para la animación de salida
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const typeStyles = {
    success: 'bg-green-600 border-green-500',
    error: 'bg-red-600 border-red-500',
    warning: 'bg-orange-600 border-orange-500',
    info: 'bg-blue-600 border-blue-500'
  };

  const typeIcons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };

  return (
    <div className={`
      fixed top-4 right-4 z-50 max-w-md p-4 rounded-lg border text-white shadow-lg
      transition-all duration-300 ease-in-out
      ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'}
      ${typeStyles[type]}
    `}>
      <div className="flex items-start space-x-3">
        <span className="text-xl flex-shrink-0 mt-0.5">
          {typeIcons[type]}
        </span>
        <div className="flex-1">
          <p className="text-sm whitespace-pre-line">{message}</p>
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="text-white hover:text-gray-200 flex-shrink-0 ml-2"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

interface ToastManagerProps {
  toasts: Array<{
    id: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
  }>;
  removeToast: (id: string) => void;
}

export function ToastManager({ toasts, removeToast }: ToastManagerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}

// Hook personalizado para manejo de toasts
export function useToast() {
  const [toasts, setToasts] = useState<Array<{
    id: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
  }>>([]);

  const addToast = (message: string, type: 'success' | 'error' | 'warning' | 'info', duration?: number) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type, duration }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return {
    toasts,
    addToast,
    removeToast,
    showSuccess: (message: string, duration?: number) => addToast(message, 'success', duration),
    showError: (message: string, duration?: number) => addToast(message, 'error', duration),
    showWarning: (message: string, duration?: number) => addToast(message, 'warning', duration),
    showInfo: (message: string, duration?: number) => addToast(message, 'info', duration),
  };
} 