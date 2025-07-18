// Script de depuración para probar actualización de productos con imágenes en variantes

// Función para probar actualización de un producto con variantes que incluyen image_url
async function debugUpdateProductWithVariants(productId, variants) {
    try {
        console.log(`🔄 Probando actualización del producto: ${productId}`);
        console.log(`📦 Variantes a actualizar:`, variants);
        
        const response = await fetch('http://localhost:8000/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: `
                    mutation UpdateProduct($productId: String!, $input: UpdateProductInput!) {
                        updateProduct(productId: $productId, productInput: $input) {
                            success
                            message
                            id
                        }
                    }
                `,
                variables: {
                    productId: productId,
                    input: {
                        variants: variants
                    }
                }
            })
        });
        
        const data = await response.json();
        console.log('✅ Resultado de actualización:', data);
        return data;
    } catch (error) {
        console.error('❌ Error actualizando producto:', error);
        return null;
    }
}

// Función para obtener un producto y ver sus variantes actuales
async function debugGetProduct(productId) {
    try {
        console.log(`🔍 Obteniendo producto: ${productId}`);
        
        const response = await fetch('http://localhost:8000/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: `
                    query GetProduct($productId: String!) {
                        product(productId: $productId) {
                            id
                            name
                            description
                            price
                            imageUrl
                            available
                            variants {
                                size
                                price
                                imageUrl
                            }
                        }
                    }
                `,
                variables: {
                    productId: productId
                }
            })
        });
        
        const data = await response.json();
        console.log('📦 Producto actual:', data);
        return data;
    } catch (error) {
        console.error('❌ Error obteniendo producto:', error);
        return null;
    }
}

// Función para obtener todos los productos y encontrar uno con variantes
async function debugGetAllProducts() {
    try {
        console.log(`🔍 Obteniendo todos los productos...`);
        
        const response = await fetch('http://localhost:8000/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: `
                    query GetProducts($restaurantId: String!) {
                        products(restaurantId: $restaurantId) {
                            id
                            name
                            description
                            price
                            imageUrl
                            available
                            variants {
                                size
                                price
                                imageUrl
                            }
                        }
                    }
                `,
                variables: {
                    restaurantId: "choripam"
                }
            })
        });
        
        const data = await response.json();
        console.log('📦 Productos encontrados:', data);
        
        // Encontrar productos con variantes
        const productsWithVariants = data.data.products.filter(p => 
            p.variants && p.variants.length > 0
        );
        
        console.log(`🎯 Productos con variantes: ${productsWithVariants.length}`);
        productsWithVariants.forEach((p, i) => {
            console.log(`  ${i + 1}. ${p.name} (${p.id}) - ${p.variants.length} variantes`);
            p.variants.forEach((v, j) => {
                console.log(`     Variante ${j + 1}: ${v.size} - $${v.price} - Imagen: ${v.imageUrl || 'Sin imagen'}`);
            });
        });
        
        return data;
    } catch (error) {
        console.error('❌ Error obteniendo productos:', error);
        return null;
    }
}

// Función principal de depuración
async function debugVariantsFlow() {
    console.log('🚀 Iniciando depuración de variantes con imágenes...\n');
    
    // 1. Obtener todos los productos
    const allProducts = await debugGetAllProducts();
    if (!allProducts || !allProducts.data) {
        console.error('❌ No se pudieron obtener productos');
        return;
    }
    
    // 2. Encontrar un producto con variantes para probar
    const productsWithVariants = allProducts.data.products.filter(p => 
        p.variants && p.variants.length > 0
    );
    
    if (productsWithVariants.length === 0) {
        console.log('⚠️ No hay productos con variantes para probar');
        return;
    }
    
    const testProduct = productsWithVariants[0];
    console.log(`\n🎯 Probando con producto: ${testProduct.name} (${testProduct.id})`);
    
    // 3. Obtener el producto actual
    const currentProduct = await debugGetProduct(testProduct.id);
    if (!currentProduct || !currentProduct.data) {
        console.error('❌ No se pudo obtener el producto actual');
        return;
    }
    
    console.log('\n📦 Estado actual del producto:');
    console.log(JSON.stringify(currentProduct.data.product, null, 2));
    
    // 4. Crear variantes de prueba con imágenes
    const testVariants = [
        {
            size: "Pequeño",
            price: 15.99,
            imageUrl: "https://example.com/small-image.jpg"
        },
        {
            size: "Mediano", 
            price: 19.99,
            imageUrl: "https://example.com/medium-image.jpg"
        },
        {
            size: "Grande",
            price: 24.99,
            imageUrl: "https://example.com/large-image.jpg"
        }
    ];
    
    console.log('\n🔄 Actualizando producto con nuevas variantes...');
    console.log('📦 Variantes de prueba:', testVariants);
    
    // 5. Actualizar el producto
    const updateResult = await debugUpdateProductWithVariants(testProduct.id, testVariants);
    if (!updateResult || !updateResult.data) {
        console.error('❌ Error en la actualización');
        return;
    }
    
    console.log('\n✅ Resultado de actualización:', updateResult.data);
    
    // 6. Verificar el resultado obteniendo el producto actualizado
    console.log('\n🔍 Verificando producto actualizado...');
    const updatedProduct = await debugGetProduct(testProduct.id);
    if (updatedProduct && updatedProduct.data) {
        console.log('\n📦 Estado final del producto:');
        console.log(JSON.stringify(updatedProduct.data.product, null, 2));
        
        // Verificar si las imágenes se guardaron
        const hasImages = updatedProduct.data.product.variants.some(v => v.imageUrl);
        console.log(`\n🎯 ¿Las variantes tienen imágenes? ${hasImages ? '✅ Sí' : '❌ No'}`);
        
        updatedProduct.data.product.variants.forEach((v, i) => {
            console.log(`  Variante ${i + 1}: ${v.size} - Imagen: ${v.imageUrl || 'Sin imagen'}`);
        });
    }
}

// Ejecutar la depuración
if (typeof window === 'undefined') {
    // Si se ejecuta en Node.js
    debugVariantsFlow().catch(console.error);
} else {
    // Si se ejecuta en el navegador
    window.debugVariantsFlow = debugVariantsFlow;
    console.log('🔧 Función debugVariantsFlow() disponible en la consola');
    console.log('💡 Ejecuta: debugVariantsFlow() para iniciar la depuración');
} 