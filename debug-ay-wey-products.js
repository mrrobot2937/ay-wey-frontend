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

async function debugAyWeyProducts() {
    console.log('🔍 Debuggeando productos de Ay Wey...\n');

    try {
        console.log('1. Probando con restaurantId: "ay-wey"');
        const result1 = await client.query({
            query: GET_PRODUCTS,
            variables: { restaurantId: 'ay-wey' },
            fetchPolicy: 'network-only'
        });

        console.log('   ✅ Respuesta exitosa:');
        console.log('   Productos encontrados:', result1.data.products.length);
        console.log('   Respuesta completa:', JSON.stringify(result1.data, null, 2));
        
        if (result1.data.products.length > 0) {
            console.log('   Primeros 3 productos:');
            result1.data.products.slice(0, 3).forEach((product, i) => {
                console.log(`     ${i + 1}. ID: ${product.id}, name: ${product.name}, restaurantId: ${product.restaurantId}`);
            });
        }

    } catch (error) {
        console.error('   ❌ Error con "ay-wey":', error);
    }

    console.log('\n2. Probando con restaurantId: "choripam" (comparación)');
    try {
        const result2 = await client.query({
            query: GET_PRODUCTS,
            variables: { restaurantId: 'choripam' },
            fetchPolicy: 'network-only'
        });

        console.log('   ✅ Respuesta exitosa:');
        console.log('   Productos encontrados:', result2.data.products.length);
        
        if (result2.data.products.length > 0) {
            console.log('   Primeros 3 productos:');
            result2.data.products.slice(0, 3).forEach((product, i) => {
                console.log(`     ${i + 1}. ID: ${product.id}, name: ${product.name}, restaurantId: ${product.restaurantId}`);
            });
        }

    } catch (error) {
        console.error('   ❌ Error con "choripam":', error);
    }

    console.log('\n🏁 Debug completado');
}

debugAyWeyProducts().catch(console.error); 