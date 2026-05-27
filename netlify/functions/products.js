const { neon } = require('@neondatabase/serverless');

exports.handler = async function (event, context) {
  // Configuración de cabeceras para permitir CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  // Manejar peticiones OPTIONS (necesario para CORS)
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    const method = event.httpMethod;
    
    // Parsear el body para operaciones de escritura
    let p = {};
    if (event.body) {
      const parsed = JSON.parse(event.body);
      p = parsed.data || parsed; 
    }

    // --- GET: Listar todos los productos ---
    if (method === 'GET') {
      const result = await sql`SELECT * FROM products ORDER BY id DESC;`;
      return { 
        statusCode: 200, 
        headers, 
        body: JSON.stringify({ status: 'success', data: result }) 
      };
    }

    // --- POST: Crear un nuevo producto ---
    if (method === 'POST') {
      const result = await sql`
        INSERT INTO products (
          title, description, availability, condition, price, sale_price,
          link, image_link, brand, quantity_to_sell_on_facebook, gtin, barcode,
          category, wholesale_price, purchase_price,
          foto_1, foto_2, foto_3, foto_4, foto_5, foto_6, foto_7
        ) VALUES (
          ${p.title}, ${p.description}, ${p.availability}, ${p.condition}, ${p.price}, ${p.sale_price || null},
          ${p.link}, ${p.image_link}, ${p.brand}, ${p.quantity_to_sell_on_facebook}, ${p.gtin || null}, ${p.barcode || null},
          ${p.category || null}, ${p.wholesale_price || null}, ${p.purchase_price || null},
          ${p.foto_1 || null}, ${p.foto_2 || null}, ${p.foto_3 || null}, ${p.foto_4 || null}, ${p.foto_5 || null}, ${p.foto_6 || null}, ${p.foto_7 || null}
        ) RETURNING id;
      `;
      return { 
        statusCode: 200, 
        headers, 
        body: JSON.stringify({ status: 'success', id: result[0].id }) 
      };
    }

    // --- PUT: Actualizar un producto existente ---
    if (method === 'PUT') {
      if (!p.id) throw new Error('ID requerido para actualizar');
      const result = await sql`
        UPDATE products SET
          title = ${p.title}, description = ${p.description}, availability = ${p.availability},
          condition = ${p.condition}, price = ${p.price}, sale_price = ${p.sale_price || null},
          link = ${p.link}, image_link = ${p.image_link}, brand = ${p.brand},
          quantity_to_sell_on_facebook = ${p.quantity_to_sell_on_facebook},
          gtin = ${p.gtin || null}, barcode = ${p.barcode || null}, category = ${p.category || null},
          wholesale_price = ${p.wholesale_price || null}, purchase_price = ${p.purchase_price || null},
          foto_1 = ${p.foto_1 || null}, foto_2 = ${p.foto_2 || null}, foto_3 = ${p.foto_3 || null},
          foto_4 = ${p.foto_4 || null}, foto_5 = ${p.foto_5 || null}, foto_6 = ${p.foto_6 || null}, foto_7 = ${p.foto_7 || null}
        WHERE id = ${p.id} RETURNING id;
      `;
      return { 
        statusCode: 200, 
        headers, 
        body: JSON.stringify({ status: 'success', id: result[0].id }) 
      };
    }

    // --- DELETE: Eliminar un producto ---
    if (method === 'DELETE') {
      if (!p.id) throw new Error('ID requerido para eliminar');
      await sql`DELETE FROM products WHERE id = ${p.id};`;
      return { 
        statusCode: 200, 
        headers, 
        body: JSON.stringify({ status: 'success', message: 'Producto eliminado exitosamente' }) 
      };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Método no permitido' }) };

  } catch (error) {
    console.error('Error en products.js:', error);
    return { 
      statusCode: 500, 
      headers, 
      body: JSON.stringify({ status: 'error', message: error.message }) 
    };
  }
};
