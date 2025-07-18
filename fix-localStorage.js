/**
 * Script para limpiar valores problemáticos del localStorage
 * Ejecutar en la consola del navegador
 */

(function() {
    console.log('🧹 Limpiando localStorage...');
    
    // Obtener datos del admin user
    const adminData = localStorage.getItem('admin_user');
    
    if (adminData) {
        try {
            const userData = JSON.parse(adminData);
            console.log('👤 Datos actuales del usuario admin:', userData);
            
            // Si el restaurant_id tiene el prefijo "rest_", limpiarlo
            if (userData.restaurant_id && userData.restaurant_id.startsWith('rest_')) {
                console.log(`🔧 Limpiando restaurant_id: ${userData.restaurant_id} → ${userData.restaurant_id.replace('rest_', '')}`);
                userData.restaurant_id = userData.restaurant_id.replace('rest_', '');
                
                // Guardar los datos actualizados
                localStorage.setItem('admin_user', JSON.stringify(userData));
                console.log('✅ Datos del usuario admin actualizados');
            } else {
                console.log('✅ No se necesita limpieza del restaurant_id');
            }
        } catch (error) {
            console.error('❌ Error procesando datos del admin:', error);
        }
    } else {
        console.log('ℹ️ No se encontraron datos del admin user en localStorage');
    }
    
    // Limpiar cualquier otro valor problemático
    const keysToCheck = Object.keys(localStorage);
    let cleaned = false;
    
    for (const key of keysToCheck) {
        const value = localStorage.getItem(key);
        if (value && value.includes('rest_ay-wey')) {
            console.log(`🔧 Limpiando clave "${key}": ${value}`);
            const cleanedValue = value.replace(/rest_ay-wey/g, 'ay-wey');
            localStorage.setItem(key, cleanedValue);
            cleaned = true;
        }
    }
    
    if (cleaned) {
        console.log('✅ localStorage limpiado exitosamente');
    } else {
        console.log('ℹ️ No se encontraron valores problemáticos para limpiar');
    }
    
    console.log('🏁 Proceso de limpieza completado');
    
    // Mostrar estado final
    console.log('📊 Estado final del localStorage:');
    for (const key of Object.keys(localStorage)) {
        const value = localStorage.getItem(key);
        if (value && (value.includes('choripam') || value.includes('restaurant'))) {
            console.log(`  ${key}: ${value.substring(0, 100)}${value.length > 100 ? '...' : ''}`);
        }
    }
})(); 