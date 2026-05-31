const { Pool } = require('pg');

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
    
    // IMPORTANTE: Ajusta esta consulta SQL con los nombres reales de tus tablas y columnas.
    // Estos son los campos requeridos mínimos/recomendados por Facebook.
    const query = `
      SELECT 
        id, 
        titulo AS title, 
        descripcion AS description, 
        disponibilidad AS availability, 
        condicion AS condition, 
        precio AS price, 
        enlace_producto AS link, 
        enlace_imagen AS image_link, 
        marca AS brand 
      FROM productos
      WHERE estado = 'activo'
    `;
    
    const result = await client.query(query);
    client.release();

    const productos = result.rows;

    if (productos.length === 0) {
      return { statusCode: 200, body: "No hay productos disponibles." };
    }

    // Obtener los nombres de las columnas (cabeceras del CSV)
    const headers = Object.keys(productos[0]);
    
    // Construir el CSV
    const csvRows = [];
    
    // 1. Agregar la fila de cabeceras
    csvRows.push(headers.join(','));
    
    // 2. Agregar los datos de cada producto
    productos.forEach(producto => {
      const row = headers.map(header => escapeCSV(producto[header]));
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
