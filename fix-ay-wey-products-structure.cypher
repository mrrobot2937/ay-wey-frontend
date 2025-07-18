// Script para corregir la estructura de productos de ay-wey
// y hacerlos compatibles con el backend GraphQL

// 1. Verificar productos actuales de ay-wey
MATCH (p:Product {restaurant_id: "ay-wey"})
RETURN p.id as id, p.name as name, p.restaurant_id as restaurant_id, 
       p.categoryId as categoryId, p.categoria as categoria,
       p.imageUrl as imageUrl, p.image_url as image_url,
       p.preparationTime as preparationTime, p.preparation_time as preparation_time,
       p.variants as variants
ORDER BY p.name;

// 2. Actualizar productos de ay-wey para que tengan la estructura correcta
MATCH (p:Product {restaurant_id: "ay-wey"})
SET 
    p.categoria = CASE 
        WHEN p.categoryId IS NOT NULL THEN p.categoryId
        ELSE "sin_categoria"
    END,
    p.image_url = CASE 
        WHEN p.imageUrl IS NOT NULL AND p.imageUrl <> "" THEN p.imageUrl
        ELSE p.image_url
    END,
    p.preparation_time = CASE 
        WHEN p.preparationTime IS NOT NULL THEN p.preparationTime
        ELSE p.preparation_time
    END,
    p.variants = CASE 
        WHEN p.variants IS NULL OR p.variants = [] THEN "[]"
        ELSE p.variants
    END
REMOVE p.categoryId, p.imageUrl, p.preparationTime;

// 3. Verificar que los cambios se aplicaron correctamente
MATCH (p:Product {restaurant_id: "ay-wey"})
RETURN p.id as id, p.name as name, p.restaurant_id as restaurant_id, 
       p.categoria as categoria, p.image_url as image_url,
       p.preparation_time as preparation_time, p.variants as variants
ORDER BY p.name;

// 4. Si no hay productos de ay-wey, crear algunos con la estructura correcta
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

// 5. Verificar el resultado final
MATCH (p:Product {restaurant_id: "ay-wey"})
RETURN p.id as id, p.name as name, p.restaurant_id as restaurant_id, 
       p.categoria as categoria, p.image_url as image_url,
       p.preparation_time as preparation_time, p.variants as variants
ORDER BY p.name; 