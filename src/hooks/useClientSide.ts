import { useState, useEffect } from 'react';

/**
 * Hook para manejar la hidratación del lado del cliente
 * Evita errores de hidratación al asegurar que el componente esté montado
 */
export function useClientSide() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return mounted;
} 