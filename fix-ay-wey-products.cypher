// Script para verificar y corregir productos de ay-wey en Neo4j

// 1. Verificar qué productos existen actualmente
MATCH (p:Product)
RETURN p.id as id, p.name as name, p.restaurant_id as restaurant_id, p.categoria as categoria
ORDER BY p.name;

// 2. Verificar si hay productos con restaurant_id = "ay-wey"
MATCH (p:Product {restaurant_id: "ay-wey"})
RETURN p.id as id, p.name as name, p.restaurant_id as restaurant_id, p.categoria as categoria
ORDER BY p.name;

// 3. Verificar productos con restaurant_id = "choripam" (para comparar)
MATCH (p:Product {restaurant_id: "choripam"})
RETURN p.id as id, p.name as name, p.restaurant_id as restaurant_id, p.categoria as categoria
ORDER BY p.name;

// 4. Si no hay productos con restaurant_id = "ay-wey", crear algunos productos de ejemplo
// Primero, crear el restaurante ay-wey si no existe
MERGE (r:AyWeyRestaurant {id: "ay-wey", name: "Ay Wey"});

// 5. Crear categorías para ay-wey si no existen
MERGE (c1:Category {id: "ay-wey-bebidas", name: "Bebidas", restaurant_id: "ay-wey"});
MERGE (c2:Category {id: "ay-wey-comidas", name: "Comidas", restaurant_id: "ay-wey"});
MERGE (c3:Category {id: "ay-wey-postres", name: "Postres", restaurant_id: "ay-wey"});

// 6. Crear productos de ejemplo para ay-wey
CREATE (p1:Product {
    id: "ay-wey-product-1",
    name: "Taco de Pastor",
    description: "Taco de pastor con piña y cilantro",
    price: 25.0,
    image_url: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400",
    available: true,
    preparation_time: 10,
    variants: "[]",
    restaurant_id: "ay-wey",
    categoria: "ay-wey-comidas",
    created_at: datetime(),
    updated_at: datetime()
});

CREATE (p2:Product {
    id: "ay-wey-product-2",
    name: "Cerveza Corona",
    description: "Cerveza mexicana refrescante",
    price: 35.0,
    image_url: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400",
    available: true,
    preparation_time: 2,
    variants: "[]",
    restaurant_id: "ay-wey",
    categoria: "ay-wey-bebidas",
    created_at: datetime(),
    updated_at: datetime()
});

CREATE (p3:Product {
    id: "ay-wey-product-3",
    name: "Flan Casero",
    description: "Flan casero con caramelo",
    price: 45.0,
    image_url: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400",
    available: true,
    preparation_time: 5,
    variants: "[]",
    restaurant_id: "ay-wey",
    categoria: "ay-wey-postres",
    created_at: datetime(),
    updated_at: datetime()
});

// 7. Crear relaciones entre productos y categorías
MATCH (p:Product {restaurant_id: "ay-wey"})
MATCH (c:Category {restaurant_id: "ay-wey"})
WHERE p.categoria = c.id
CREATE (p)-[:BELONGS_TO]->(c);

// 8. Crear relaciones entre productos y restaurante
MATCH (p:Product {restaurant_id: "ay-wey"})
MATCH (r:AyWeyRestaurant {id: "ay-wey"})
CREATE (p)-[:OFFERED_BY]->(r);

// 9. Verificar que los productos se crearon correctamente
MATCH (p:Product {restaurant_id: "ay-wey"})
RETURN p.id as id, p.name as name, p.restaurant_id as restaurant_id, p.categoria as categoria
ORDER BY p.name;

// 10. Verificar las relaciones creadas
MATCH (p:Product {restaurant_id: "ay-wey"})-[r:BELONGS_TO]->(c:Category)
RETURN p.name as producto, c.name as categoria;

MATCH (p:Product {restaurant_id: "ay-wey"})-[r:OFFERED_BY]->(rest:AyWeyRestaurant)
RETURN p.name as producto, rest.name as restaurante; 