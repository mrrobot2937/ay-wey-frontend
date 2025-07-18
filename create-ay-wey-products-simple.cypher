// Script simple para crear productos de ay-wey

// Crear productos de ejemplo para ay-wey
CREATE (p1:Product {
    id: "ay-wey-taco-pastor",
    name: "Taco de Pastor",
    description: "Taco de pastor con piña y cilantro",
    price: 25.0,
    image_url: "https://terrazaedenfiles.s3.us-east-2.amazonaws.com/prducts/choripapa-clasica.jpeg",
    available: true,
    preparation_time: 10,
    variants: "[]",
    restaurant_id: "ay-wey",
    categoria: "comidas",
    created_at: datetime(),
    updated_at: datetime()
});

CREATE (p2:Product {
    id: "ay-wey-cerveza-corona",
    name: "Cerveza Corona",
    description: "Cerveza mexicana refrescante",
    price: 35.0,
    image_url: "https://terrazaedenfiles.s3.us-east-2.amazonaws.com/prducts/choripapa-clasica.jpeg",
    available: true,
    preparation_time: 2,
    variants: "[]",
    restaurant_id: "ay-wey",
    categoria: "bebidas",
    created_at: datetime(),
    updated_at: datetime()
});

CREATE (p3:Product {
    id: "ay-wey-flan-casero",
    name: "Flan Casero",
    description: "Flan casero con caramelo",
    price: 45.0,
    image_url: "https://terrazaedenfiles.s3.us-east-2.amazonaws.com/prducts/choripapa-clasica.jpeg",
    available: true,
    preparation_time: 5,
    variants: "[]",
    restaurant_id: "ay-wey",
    categoria: "postres",
    created_at: datetime(),
    updated_at: datetime()
});

// Verificar que se crearon
MATCH (p:Product {restaurant_id: "ay-wey"})
RETURN p.id as id, p.name as name, p.restaurant_id as restaurant_id, p.categoria as categoria
ORDER BY p.name; 