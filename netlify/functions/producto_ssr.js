const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

// Lista de identificadores (User-Agents) de los bots de redes sociales más comunes
const BOT_AGENTS = ['WhatsApp', 'facebookexternalhit', 'Twitterbot', 'LinkedInBot', 'Pinterest', 'Slackbot', 'TelegramBot'];

exports.handler = async (event, context) => {
    try {
        // 1. Obtener el ID y el User-Agent
        const { id } = event.queryStringParameters || {};
        const userAgent = event.headers['user-agent'] || '';

        // 2. Verificar si el que visita es un BOT o un HUMANO
        const isBot = BOT_AGENTS.some(bot => userAgent.includes(bot));

        // 3. Leer tu archivo producto.html original desde la raíz
        const htmlPath = path.join(process.cwd(), 'producto.html');
        let htmlTemplate = fs.readFileSync(htmlPath, 'utf8');

        // ¡EL TRUCO DE VELOCIDAD AQUÍ!
        // Si NO hay ID, o si ES UN USUARIO REAL (Chrome, Safari, etc), devolvemos el HTML estático AL INSTANTE.
        // Esto evita la doble consulta a la base de datos y carga la página a máxima velocidad.
        if (!id || !isBot) {
            return { 
                statusCode: 200, 
                headers: { 'Content-Type': 'text/html; charset=utf-8' }, 
                body: htmlTemplate 
            };
        }

        // ====================================================================
        // DE AQUÍ EN ADELANTE SOLO SE EJECUTA SI EL VISITANTE ES WHATSAPP/FB
        // ====================================================================

        // 4. Conectar a Neon y buscar SOLO los datos necesarios para los Meta Tags
        const sql = neon(process.env.DATABASE_URL);
        const result = await sql`
            SELECT title, description, image_link 
            FROM products 
            WHERE id = ${id} 
            LIMIT 1
        `;

        // 5. Si el producto existe, INYECTAMOS los datos en el HTML
        if (result.length > 0) {
            const product = result[0];
            const mainImage = product.image_link || 'https://ventas12.netlify.app/images/arelyshop-preview.webp';
            
            // Limpiamos la descripción de saltos de línea para el previo
            const cleanDesc = (product.description || '')
                .replace(/\*/g, '')
                .replace(/\n/g, ' ')
                .substring(0, 150) + '...';

            // Reemplazamos los textos (Nota: Agregué el .COM para que coincida exactamente con tu HTML actual)
            htmlTemplate = htmlTemplate
                .replaceAll('Cargando Producto... - ARELYSHOP.COM', `${product.title} - ARELYSHOP.COM`)
                .replaceAll('Visita ARELYSHOP VENTAS y descubre los mejores accesorios.', cleanDesc)
                .replaceAll('https://ventas12.netlify.app/images/arelyshop-preview.webp', mainImage);
        }

        // 6. Devolver el HTML ya procesado a WhatsApp
        return {
            statusCode: 200,
            headers: { 
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': 'public, max-age=0, must-revalidate' 
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
