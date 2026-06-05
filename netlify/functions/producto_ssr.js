const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

exports.handler = async (event, context) => {
    try {
        // 1. Obtener el ID de la URL (ej: ?id=83)
        const { id } = event.queryStringParameters || {};

        // 2. Leer tu archivo producto.html original desde la raíz
        // process.cwd() apunta a la raíz del sitio en Netlify
        const htmlPath = path.join(process.cwd(), 'producto.html');
        let htmlTemplate = fs.readFileSync(htmlPath, 'utf8');

        // Si no hay ID en el enlace, simplemente mostramos la página normal
        if (!id) {
            return { 
                statusCode: 200, 
                headers: { 'Content-Type': 'text/html; charset=utf-8' }, 
                body: htmlTemplate 
            };
        }

        // 3. Conectar a Neon y buscar SOLO los datos necesarios para los Meta Tags
        const sql = neon(process.env.DATABASE_URL);
        const result = await sql`
            SELECT title, description, image_link 
            FROM products 
            WHERE id = ${id} 
            LIMIT 1
        `;

        // 4. Si el producto existe, INYECTAMOS los datos en el HTML
        if (result.length > 0) {
            const product = result[0];
            const mainImage = product.image_link || 'https://ventas12.netlify.app/images/arelyshop-preview.webp';
            
            // Limpiamos la descripción de saltos de línea para el previo
            const cleanDesc = (product.description || '')
                .replace(/\*/g, '')
                .replace(/\n/g, ' ')
                .substring(0, 150) + '...';

            // EL TRUCO: Reemplazamos los textos genéricos por los del producto real
            htmlTemplate = htmlTemplate
                .replaceAll('Cargando Producto... - ARELYSHOP', product.title)
                .replaceAll('Visita ARELYSHOP VENTAS y descubre los mejores accesorios.', cleanDesc)
                .replaceAll('https://ventas12.netlify.app/images/arelyshop-preview.webp', mainImage);
        }

        // 5. Devolver el HTML ya procesado a WhatsApp o al navegador
        return {
            statusCode: 200,
            headers: { 
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': 'public, max-age=0, must-revalidate' // Previene caché incorrecta
            },
            body: htmlTemplate
        };

    } catch (error) {
        console.error('Error en SSR:', error);
        return {
            statusCode: 500,
            body: 'Error interno del servidor al procesar el producto.'
        };
    }
};
