/**
 * Script para debugging en tiempo real - ejecutar en la consola del navegador
 * Intercepta todas las requests para encontrar dónde se origina "rest_choripam"
 */

(function() {
    console.log('🕵️ Iniciando monitoreo en tiempo real...');
    
    // Interceptar fetch
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        const [url, options] = args;
        
        // Log de todas las requests
        console.log('🌐 FETCH REQUEST:', {
            url: url,
            method: options?.method || 'GET',
            body: options?.body
        });
        
        // Si es una request GraphQL, loggear el body
        if (url.includes('graphql') && options?.body) {
            try {
                const body = JSON.parse(options.body);
                console.log('📡 GRAPHQL REQUEST:', {
                    query: body.query?.substring(0, 100) + '...',
                    variables: body.variables
                });
                
                // Buscar "rest_choripam" en las variables
                if (JSON.stringify(body.variables).includes('rest_choripam')) {
                    console.error('🚨 ENCONTRADO rest_choripam en variables!', body.variables);
                    console.trace('Stack trace:');
                }
                
                // Buscar cualquier variable restaurantId
                if (body.variables?.restaurantId) {
                    console.log('🏪 RestaurantId detectado:', body.variables.restaurantId);
                }
            } catch (e) {
                console.log('⚠️ No se pudo parsear el body GraphQL');
            }
        }
        
        return originalFetch.apply(this, args);
    };
    
    // Interceptar XMLHttpRequest
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;
    
    XMLHttpRequest.prototype.open = function(method, url, ...rest) {
        this._url = url;
        this._method = method;
        return originalXHROpen.apply(this, [method, url, ...rest]);
    };
    
    XMLHttpRequest.prototype.send = function(body) {
        console.log('🔗 XHR REQUEST:', {
            method: this._method,
            url: this._url,
            body: body
        });
        
        if (this._url.includes('graphql') && body) {
            try {
                const parsedBody = JSON.parse(body);
                console.log('📡 XHR GRAPHQL REQUEST:', {
                    query: parsedBody.query?.substring(0, 100) + '...',
                    variables: parsedBody.variables
                });
                
                if (JSON.stringify(parsedBody.variables).includes('rest_choripam')) {
                    console.error('🚨 ENCONTRADO rest_choripam en XHR variables!', parsedBody.variables);
                    console.trace('Stack trace:');
                }
            } catch (e) {
                console.log('⚠️ No se pudo parsear el body XHR GraphQL');
            }
        }
        
        return originalXHRSend.apply(this, [body]);
    };
    
    // Monitorear localStorage
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
        console.log('💾 LOCALSTORAGE SET:', { key, value });
        
        if (value.includes && value.includes('rest_choripam')) {
            console.error('🚨 ENCONTRADO rest_choripam siendo guardado en localStorage!', { key, value });
            console.trace('Stack trace:');
        }
        
        return originalSetItem.apply(this, [key, value]);
    };
    
    // Monitorear acceso al localStorage
    const originalGetItem = Storage.prototype.getItem;
    Storage.prototype.getItem = function(key) {
        const value = originalGetItem.apply(this, [key]);
        
        if (key === 'admin_user' || key.includes('restaurant')) {
            console.log('📖 LOCALSTORAGE GET:', { key, value });
        }
        
        if (value && value.includes && value.includes('rest_choripam')) {
            console.warn('⚠️ VALOR rest_choripam leído de localStorage:', { key, value });
        }
        
        return value;
    };
    
    // Mostrar estado actual del localStorage
    console.log('📊 Estado actual del localStorage:');
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        if (value && (value.includes('choripam') || value.includes('restaurant'))) {
            console.log(`  ${key}: ${value}`);
        }
    }
    
    console.log('✅ Monitoreo activado. Ahora intenta hacer la acción que causa el problema...');
})(); 