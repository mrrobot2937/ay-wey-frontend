#!/usr/bin/env node

/**
 * Script de debug para verificar el problema del restaurant_id
 */

const { ApolloClient, InMemoryCache, createHttpLink, gql } = require('@apollo/client');
const { setContext } = require('@apollo/client/link/context');
const fetch = require('node-fetch');

// Configurar Apollo Client
const httpLink = createHttpLink({
    uri: 'http://localhost:8000/graphql',
    fetch: fetch,
});

const authLink = setContext((_, { headers }) => {
    return {
        headers: {
            ...headers,
            'Content-Type': 'application/json',
        }
    }
});

const client = new ApolloClient({
    link: authLink.concat(httpLink),
    cache: new InMemoryCache(),
    defaultOptions: {
        watchQuery: {
            errorPolicy: 'all',
        },
        query: {
            errorPolicy: 'all',
        },
    },
});

// Query para obtener órdenes
const GET_ORDERS = gql`
    query GetOrders($restaurantId: String!, $status: String, $limit: Int) {
        orders(restaurantId: $restaurantId, status: $status, limit: $limit) {
            id
            restaurantId
            status
            deliveryMethod
            total
            customer {
                name
                phone
            }
            createdAt
        }
    }
`;

async function debugGraphQL() {
    console.log('🔍 Iniciando debug de GraphQL...\n');

    // Test 1: Verificar con restaurant_id = "ay-wey"
    console.log('1. Testeando con restaurantId: "ay-wey"');
    try {
        const result1 = await client.query({
            query: GET_ORDERS,
            variables: {
                restaurantId: 'ay-wey',
                status: undefined,
                limit: undefined
            },
            fetchPolicy: 'network-only'
        });

        console.log('   ✅ Respuesta exitosa:');
        console.log('   Orders encontradas:', result1.data.orders.length);
        console.log('   Primeras 3 órdenes:');
        result1.data.orders.slice(0, 3).forEach((order, i) => {
            console.log(`     ${i + 1}. ID: ${order.id}, restaurantId: ${order.restaurantId}, status: ${order.status}`);
        });
        console.log('');

    } catch (error) {
        console.error('   ❌ Error con "choripam":', error);
        console.log('');
    }

    // Test 2: Verificar con restaurant_id = "rest_ay-wey"
    console.log('2. Testeando con restaurantId: "rest_ay-wey"');
    try {
        const result2 = await client.query({
            query: GET_ORDERS,
            variables: {
                restaurantId: 'rest_ay-wey',
                status: undefined,
                limit: undefined
            },
            fetchPolicy: 'network-only'
        });

        console.log('   ✅ Respuesta exitosa:');
        console.log('   Orders encontradas:', result2.data.orders.length);
        console.log('   Primeras 3 órdenes:');
        result2.data.orders.slice(0, 3).forEach((order, i) => {
            console.log(`     ${i + 1}. ID: ${order.id}, restaurantId: ${order.restaurantId}, status: ${order.status}`);
        });
        console.log('');

    } catch (error) {
        console.error('   ❌ Error con "rest_choripam":', error);
        console.log('');
    }

    // Test 3: Verificar productos también
    console.log('3. Testeando productos con restaurantId: "ay-wey"');
    const GET_PRODUCTS = gql`
        query GetProducts($restaurantId: String!) {
            products(restaurantId: $restaurantId) {
                id
                name
                restaurantId
                available
            }
        }
    `;

    try {
        const result3 = await client.query({
            query: GET_PRODUCTS,
            variables: {
                restaurantId: 'ay-wey'
            },
            fetchPolicy: 'network-only'
        });

        console.log('   ✅ Respuesta exitosa:');
        console.log('   Productos encontrados:', result3.data.products.length);
        console.log('   Primeros 3 productos:');
        result3.data.products.slice(0, 3).forEach((product, i) => {
            console.log(`     ${i + 1}. ID: ${product.id}, name: ${product.name}, restaurantId: ${product.restaurantId}`);
        });
        console.log('');

    } catch (error) {
        console.error('   ❌ Error obteniendo productos:', error);
        console.log('');
    }

    console.log('🏁 Debug completado');
}

debugGraphQL().catch(console.error); 