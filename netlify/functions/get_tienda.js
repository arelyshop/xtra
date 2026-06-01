// Importamos el cliente oficial de Neon para entornos Serverless
const { neon } = require('@neondatabase/serverless');

exports.handler = async (event, context) => {
    // Configuración de CORS por si pruebas desde localhost o dominios externos
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
        // Asegúrate de agregar DATABASE_URL en las variables de entorno de Netlify
        const sql = neon(process.env.DATABASE_URL);

        // 2. Extraer los parámetros de la URL (AÑADIMOS 'search' AQUÍ)
        const { id, brand, category, limit, exclude_id, search } = event.queryStringParameters || {};

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
                body: JSON.stringify(result[0]) // Devolvemos el objeto del producto
            };
        }

        // CASO B: Buscador de texto (NUEVO BLOQUE PARA EL BUSCADOR DE LA WEB)
        if (search) {
            const limitNum = parseInt(limit) || 5;
            // Usamos % para buscar coincidencias parciales con ILIKE (no distingue mayúsculas)
            const searchPattern = `%${search}%`; 
            
            const result = await sql`
                SELECT * FROM products 
                WHERE title ILIKE ${searchPattern} 
                   OR description ILIKE ${searchPattern}
                   OR gtin ILIKE ${searchPattern}
                LIMIT ${limitNum}
            `;
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(result) // Devolvemos resultados de la búsqueda
            };
        }

        // CASO C: Buscar productos relacionados (Upsell) [Antes era el Caso B]
        if (brand || category) {
            const limitNum = parseInt(limit) || 4;
            const b = brand || '';
            const c = category || '';
            
            // Busca productos de la misma marca O categoría (excluyendo el que se está viendo)
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
                body: JSON.stringify(result) // Devolvemos un array de productos
            };
        }

        // CASO D: Catálogo general. [Antes era el Caso C]
        // ¡CORRECCIÓN AQUÍ! Ahora respeta el "limit" que envía la página web. Si no envían nada, devuelve 10.
        const generalLimit = parseInt(limit) || 10;

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
