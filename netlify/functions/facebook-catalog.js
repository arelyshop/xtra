// Cambiamos 'pg' por '@neondatabase/serverless' que es lo que tienes instalado
const { Pool } = require('@neondatabase/serverless');

// Configuración de la conexión a la base de datos Neon
// Asegúrate de tener configurada la variable de entorno DATABASE_URL en Netlify
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Requerido por Neon
  }
});

// Función para escapar textos en CSV (maneja comas y comillas dentro de las descripciones)
const escapeCSV = (text) => {
  if (text === null || text === undefined) return '';
  const stringValue = text.toString();
  // Si el texto contiene comas, saltos de línea o comillas, lo envolvemos en comillas dobles
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`; // Escapa las comillas dobles
  }
  return stringValue;
};

exports.handler = async (event, context) => {
  try {
    const client = await pool.connect();
    
    // Consulta SQL ACTUALIZADA: 
    // Se quitó el filtro WHERE para traer TODOS los productos de la tabla.
    // También se quitó "quantity_to_sell_on_facebook" del SELECT para que su valor quede vacío en el CSV.
    // Se agregó ORDER BY id ASC para que el archivo esté ordenado por ID.
    const query = `
      SELECT 
        id, 
        title, 
        description, 
        availability, 
        condition, 
        price, 
        sale_price,
        link, 
        image_link, 
        brand,
        gtin
      FROM products
      ORDER BY id ASC
    `;
    
    const result = await client.query(query);
    client.release();

    const productos = result.rows;

    if (productos.length === 0) {
      return { statusCode: 200, body: "No hay productos disponibles." };
    }

    // Definimos todas las cabeceras exactas que Facebook pide (Obligatorias y Opcionales)
    const facebookHeaders = [
      "id", "title", "description", "availability", "condition", "price",
      "link", "image_link", "brand", "google_product_category", "fb_product_category",
      "quantity_to_sell_on_facebook", "sale_price", "sale_price_effective_date", 
      "item_group_id", "gender", "color", "size", "age_group", "material", "pattern", 
      "shipping", "shipping_weight", "offer_disclaimer", "offer_disclaimer_url", 
      "video[0].url", "video[0].tag[0]", "gtin", "product_tags[0]", "product_tags[1]", 
      "compatible_devices[0]", "product_height", "product_length", "product_width", 
      "connector_type", "product_weight", "standard_features[0]", "usb_technology", 
      "usb_type", "wireless_technologies[0]", "bluetooth_technology", "cable_length", 
      "headphone_features[0]", "max_load_weight", "maximum_screen_size", 
      "minimum_screen_size", "mount_type"
    ];
    
    // Construir el CSV
    const csvRows = [];
    
    // 1. Agregar la fila de cabeceras
    csvRows.push(facebookHeaders.join(','));
    
    // 2. Agregar los datos de cada producto
    productos.forEach(producto => {
      const row = facebookHeaders.map(header => {
        let value = '';
        
        // Lógica especial para agregar la moneda a los precios
        if (header === 'price' && producto.price) {
          value = `${producto.price} BOB`;
        } else if (header === 'sale_price' && producto.sale_price) {
          value = `${producto.sale_price} BOB`;
        } else if (producto[header] !== undefined && producto[header] !== null) {
          // Si la columna existe en nuestra consulta a la BD, la asignamos
          value = producto[header];
        }
        
        // Escapamos el valor para evitar problemas con comas en las descripciones
        return escapeCSV(value);
      });
      csvRows.push(row.join(','));
    });

    const csvString = csvRows.join('\n');

    // Retornar la respuesta con los headers correctos para que Facebook lo detecte como archivo CSV
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="catalogo-facebook.csv"',
        'Cache-Control': 'no-cache' // Evita que Netlify guarde en caché una versión vieja
      },
      body: csvString
    };

  } catch (error) {
    console.error('Error al generar el catálogo CSV:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error interno del servidor al generar el catálogo.' })
    };
  }
};
