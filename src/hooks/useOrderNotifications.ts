import { useState, useEffect, useRef, useCallback } from 'react';
import { apiService } from '../services/api-service';

interface OrderNotificationHook {
    newOrdersCount: number;
    isPlaying: boolean;
    stopAlarm: () => void;
    lastCheckTime: Date | null;
    resetNewOrdersCount: () => void;
}

export const useOrderNotifications = (
    restaurantId: string = 'ay-wey',
    intervalMs: number = 15000,
    enabled: boolean = true
): OrderNotificationHook => {
    // ARREGLO: Si el restaurantId tiene el prefijo "rest_", quitarlo
    const cleanRestaurantId = restaurantId.startsWith('rest_') ? restaurantId.replace('rest_', '') : restaurantId;
    console.log(`🔧 HOOK: Restaurant ID limpio: ${restaurantId} → ${cleanRestaurantId}`);
    const [newOrdersCount, setNewOrdersCount] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);

    // Usar useRef para previousOrderIds para evitar recreaciones del callback
    const previousOrderIdsRef = useRef<Set<string>>(new Set());

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const isPlayingRef = useRef(false);
    const checkOrdersRef = useRef<(() => Promise<void>) | null>(null);

    // Actualizar ref cuando cambie isPlaying
    useEffect(() => {
        isPlayingRef.current = isPlaying;
    }, [isPlaying]);

    const stopAlarm = useCallback(() => {
        setIsPlaying(false);
    }, []);

    const resetNewOrdersCount = useCallback(() => {
        setNewOrdersCount(0);
    }, []);

    // Función para reproducir alarma
    const playAlarm = useCallback(() => {
        if (isPlayingRef.current) {
            console.log('🔇 Alarma ya está sonando, omitiendo...');
            return;
        }

        console.log('🔊 REPRODUCIENDO ALARMA...');
        setIsPlaying(true);

        try {
            const audioContext = new AudioContext();

            // Primer beep
            const playBeep = (frequency: number, delay: number = 0) => {
                setTimeout(() => {
                    try {
                        const oscillator = audioContext.createOscillator();
                        const gainNode = audioContext.createGain();

                        oscillator.connect(gainNode);
                        gainNode.connect(audioContext.destination);

                        oscillator.frequency.value = frequency;
                        oscillator.type = 'square';
                        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);

                        oscillator.start();
                        oscillator.stop(audioContext.currentTime + 1);
                    } catch (e) {
                        console.warn(`Error beep ${frequency}Hz:`, e);
                    }
                }, delay);
            };

            // Secuencia de beeps
            playBeep(1000, 0);    // Inmediato
            playBeep(800, 1200);  // Después de 1.2s
            playBeep(1000, 2400); // Después de 2.4s

            // Limpiar después de 3.5s
            setTimeout(() => {
                setIsPlaying(false);
                audioContext.close().catch(e => console.warn('Error cerrando audio:', e));
            }, 3500);

        } catch (error) {
            console.error('❌ Error en alarma:', error);
            setIsPlaying(false);
        }
    }, []);

    // Función de verificación de órdenes - SIN dependencias problemáticas
    const checkOrders = useCallback(async () => {
        try {
            const timestamp = new Date().toISOString();
            console.log(`🔍 [${timestamp}] Verificando nuevos pedidos...`);

            // SIEMPRE forzar actualización para datos frescos
            const response = await apiService.getOrders(cleanRestaurantId, undefined, undefined, true);
            console.log(`📝 [${timestamp}] Respuesta API:`, response);

            if (!response.orders || !Array.isArray(response.orders)) {
                throw new Error('Respuesta inválida de API');
            }

            // Filtrar órdenes relevantes para notificaciones 
            const relevantOrders = response.orders.filter(order =>
                order.status === 'PENDING' || order.status === 'CONFIRMED'
            );
            console.log(`⏳ [${timestamp}] Órdenes relevantes:`, relevantOrders.length, relevantOrders.map(o => ({
                id: o.id,
                status: o.status,
                method: o.deliveryMethod,
                customer: o.customer.name
            })));

            const currentOrderIds = new Set(relevantOrders.map(order => order.id));
            console.log(`🆔 [${timestamp}] IDs actuales:`, Array.from(currentOrderIds));
            console.log(`🆔 [${timestamp}] IDs anteriores:`, Array.from(previousOrderIdsRef.current));

            // Detectar nuevas órdenes usando la ref
            const newOrders = [...currentOrderIds].filter(id => !previousOrderIdsRef.current.has(id));
            console.log(`🆕 [${timestamp}] Nuevos pedidos detectados:`, newOrders);

            if (newOrders.length > 0) {
                console.log(`🚨 [${timestamp}] ¡ALARMA! Nuevos pedidos:`, newOrders.length);

                // Incrementar contador
                setNewOrdersCount(prev => {
                    const newCount = prev + newOrders.length;
                    console.log(`📊 [${timestamp}] Contador actualizado: ${prev} → ${newCount}`);
                    return newCount;
                });

                // Reproducir alarma SOLO si hay nuevas órdenes
                console.log(`🔊 [${timestamp}] REPRODUCIENDO ALARMA PARA NUEVAS ÓRDENES...`);
                playAlarm();

                // Notificación del navegador
                if ('Notification' in window && Notification.permission === 'granted') {
                    console.log(`📢 [${timestamp}] Enviando notificación del navegador...`);
                    new Notification('¡Nuevo Pedido!', {
                        body: `${newOrders.length} nuevo(s) pedido(s) pendiente(s)`,
                        icon: '/favicon.ico',
                        tag: 'new-order'
                    });
                } else {
                    console.log(`🔕 [${timestamp}] Notificaciones del navegador no disponibles`);
                }
            } else {
                console.log(`✅ [${timestamp}] No hay nuevas órdenes - sin alarma`);
            }

            // Actualizar estado usando la ref
            previousOrderIdsRef.current = currentOrderIds;
            setLastCheckTime(new Date());
            console.log(`✅ [${timestamp}] Verificación completada`);

        } catch (error) {
            const timestamp = new Date().toISOString();
            console.error(`❌ [${timestamp}] Error verificando pedidos:`, error);
        }
    }, [cleanRestaurantId, playAlarm]); // Removida la dependencia problemática

    // Actualizar la ref cuando cambie la función
    useEffect(() => {
        checkOrdersRef.current = checkOrders;
    }, [checkOrders]);

    // Configurar intervalo principal - SOLO cuando cambien las dependencias estables
    useEffect(() => {
        console.log('🔔 Configurando notificaciones:', { enabled, intervalMs, restaurantId: cleanRestaurantId });

        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }

        if (!enabled) {
            console.log('❌ Notificaciones deshabilitadas');
            return;
        }

        let hasInitialized = false; // Flag para controlar la inicialización

        // Primera verificación inmediata
        console.log('🚀 Iniciando primera verificación...');
        checkOrders().then(() => {
            hasInitialized = true;
        });

        // Configurar intervalo usando la ref para evitar recreaciones
        console.log(`⏰ Configurando intervalo cada ${intervalMs}ms`);
        intervalRef.current = setInterval(() => {
            if (hasInitialized && checkOrdersRef.current) {
                console.log('⏰ Ejecutando verificación por intervalo...');
                checkOrdersRef.current();
            }
        }, intervalMs);

        return () => {
            console.log('🧹 Limpiando intervalo...');
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [enabled, intervalMs, cleanRestaurantId, checkOrders]); // Removida la dependencia de checkOrders

    // Solicitar permisos de notificación
    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                console.log('📢 Permisos de notificación:', permission);
            });
        }
    }, []);

    return {
        newOrdersCount,
        isPlaying,
        stopAlarm,
        lastCheckTime,
        resetNewOrdersCount
    };
}; 