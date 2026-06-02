// Importamos el cliente oficial de Neon para entornos Serverless
const { neon } = require('@neondatabase/serverless');

exports.handler = async (event, context) => {
    // Configuración de CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Responder rápidamente a las peticiones preflight (CORS)
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        // 1. Conectar a la base de datos de Neon
        const sql = neon(process.env.DATABASE_URL);

        // 2. Extraer los parámetros de la URL
        const { id, brand, category, limit, exclude_id, search, action } = event.queryStringParameters || {};
        
        // --- NUEVO CASO: Obtener lista única de Categorías y Marcas para los Menús ---
        if (action === 'get_menu_data') {
            // Obtenemos categorías únicas ignorando nulos o vacíos
            const categoriesResult = await sql`
                SELECT DISTINCT category 
                FROM products 
                WHERE category IS NOT NULL AND category != '' 
                ORDER BY category ASC
            `;
            
            // Obtenemos marcas únicas ignorando nulos o vacíos
            const brandsResult = await sql`
                SELECT DISTINCT brand 
                FROM products 
                WHERE brand IS NOT NULL AND brand != '' 
                ORDER BY brand ASC
            `;
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    categories: categoriesResult.map(row => row.category),
                    brands: brandsResult.map(row => row.brand)
                })
            };
        }

        // --- MEJORA: Centralización del límite dinámico ---
        // Si el frontend envía un límite (ej. 5000), lo usa. Si no, mantiene los defaults de cada caso.
        const requestedLimit = limit ? parseInt(limit) : null;

        // CASO A: Buscar un producto específico por ID
        if (id) {
            const result = await sql`
                SELECT * FROM products 
                WHERE id = ${id}
                LIMIT 1
            `;

            if (result.length === 0) {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({ error: 'Producto no encontrado' })
                };
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(result[0])
            };
        }

        // CASO B: Buscador de texto
        if (search) {
            const limitNum = requestedLimit || 5;
            const searchPattern = `%${search}%`; 
            
            const result = await sql`
                SELECT * FROM products 
                WHERE title ILIKE ${searchPattern} 
                   OR description ILIKE ${searchPattern}
                   OR gtin ILIKE ${searchPattern}
                ORDER BY 
                    (CASE WHEN title ILIKE ${searchPattern} THEN 0 ELSE 1 END),
                    title ASC
                LIMIT ${limitNum}
            `;
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(result)
            };
        }

        // CASO C: Buscar productos relacionados (Upsell)
        if (brand || category) {
            const limitNum = requestedLimit || 4;
            const b = brand || '';
            const c = category || '';
            
            let result;
            if (exclude_id) {
                result = await sql`
                    SELECT * FROM products 
                    WHERE id != ${exclude_id}
                      AND (
                          (brand = ${b} AND brand != '') 
                          OR 
                          (category = ${c} AND category != '')
                      )
                    LIMIT ${limitNum}
                `;
            } else {
                result = await sql`
                    SELECT * FROM products 
                    WHERE (brand = ${b} AND brand != '') 
                       OR (category = ${c} AND category != '')
                    LIMIT ${limitNum}
                `;
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(result)
            };
        }

        // CASO D: Catálogo general
        const generalLimit = requestedLimit || 10;
        const result = await sql`
            SELECT * FROM products 
            LIMIT ${generalLimit}
        `;

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(result)
        };

    } catch (error) {
        console.error('Error en la base de datos:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Error interno del servidor', details: error.message })
        };
    }
};
