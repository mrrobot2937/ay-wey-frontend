const { ApolloClient, InMemoryCache, gql } = require('@apollo/client');

// Configurar Apollo Client
const client = new ApolloClient({
  uri: 'https://choripam-backend-real.vercel.app/graphql',
  cache: new InMemoryCache(),
});

const GET_PRODUCTS = gql`
  fragment ProductFields on Product {
    id
    name
    description
    price
    imageUrl
    available
    preparationTime
    restaurantId
    category {
      id
      name
      description
    }
    variants {
      size
      price
      imageUrl
    }
  }

  query GetProducts($restaurantId: String!) {
    products(restaurantId: $restaurantId) {
      ...ProductFields
    }
  }
`;

const GET_ALL_PRODUCTS = gql`
  query GetAllProducts {
    products {
      id
      name
      restaurantId
      available
    }
  }
`;

async function debugAyWeyBackend() {
    console.log('🔍 Debuggeando backend para Ay Wey...\n');

    try {
        // 1. Verificar si el backend responde
        console.log('1. Probando conexión al backend...');
        const testResult = await client.query({
            query: gql`query { __typename }`,
            fetchPolicy: 'network-only'
        });
        console.log('   ✅ Backend responde correctamente');

        // 2. Obtener todos los productos sin filtro
        console.log('\n2. Obteniendo todos los productos sin filtro...');
        const allProductsResult = await client.query({
            query: GET_ALL_PRODUCTS,
            fetchPolicy: 'network-only'
        });
        
        console.log(`   📦 Total de productos en la base de datos: ${allProductsResult.data.products.length}`);
        
        if (allProductsResult.data.products.length > 0) {
            console.log('   Primeros 5 productos:');
            allProductsResult.data.products.slice(0, 5).forEach((product, i) => {
                console.log(`     ${i + 1}. ID: ${product.id}, name: ${product.name}, restaurantId: ${product.restaurantId}`);
            });
        }

        // 3. Verificar productos por restaurantId
        console.log('\n3. Verificando productos por restaurantId...');
        
        const restaurantIds = ['ay-wey', 'choripam', 'test'];
        
        for (const restaurantId of restaurantIds) {
            try {
                console.log(`\n   Probando con restaurantId: "${restaurantId}"`);
                const result = await client.query({
                    query: GET_PRODUCTS,
                    variables: { restaurantId },
                    fetchPolicy: 'network-only'
                });

                console.log(`   ✅ Respuesta exitosa: ${result.data.products.length} productos encontrados`);
                
                if (result.data.products.length > 0) {
                    console.log('   Primeros 3 productos:');
                    result.data.products.slice(0, 3).forEach((product, i) => {
                        console.log(`     ${i + 1}. ID: ${product.id}, name: ${product.name}, restaurantId: ${product.restaurantId}`);
                    });
                } else {
                    console.log('   ⚠️ No se encontraron productos para este restaurantId');
                }

            } catch (error) {
                console.error(`   ❌ Error con restaurantId "${restaurantId}":`, error.message);
            }
        }

        // 4. Verificar si hay productos con restaurantId = "ay-wey" en la base de datos
        console.log('\n4. Verificando productos específicos de ay-wey...');
        const ayWeyProducts = allProductsResult.data.products.filter(p => p.restaurantId === 'ay-wey');
        console.log(`   📦 Productos con restaurantId = "ay-wey": ${ayWeyProducts.length}`);
        
        if (ayWeyProducts.length > 0) {
            console.log('   Productos encontrados:');
            ayWeyProducts.forEach((product, i) => {
                console.log(`     ${i + 1}. ID: ${product.id}, name: ${product.name}, restaurantId: ${product.restaurantId}`);
            });
        } else {
            console.log('   ⚠️ No hay productos con restaurantId = "ay-wey" en la base de datos');
        }

        // 5. Verificar productos con restaurantId = "choripam" para comparar
        console.log('\n5. Verificando productos de choripam para comparar...');
        const choripamProducts = allProductsResult.data.products.filter(p => p.restaurantId === 'choripam');
        console.log(`   📦 Productos con restaurantId = "choripam": ${choripamProducts.length}`);
        
        if (choripamProducts.length > 0) {
            console.log('   Primeros 3 productos de choripam:');
            choripamProducts.slice(0, 3).forEach((product, i) => {
                console.log(`     ${i + 1}. ID: ${product.id}, name: ${product.name}, restaurantId: ${product.restaurantId}`);
            });
        }

    } catch (error) {
        console.error('❌ Error general:', error);
    }

    console.log('\n🏁 Debug completado');
}

debugAyWeyBackend().catch(console.error); 