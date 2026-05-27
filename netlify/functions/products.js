const { neon } = require('@neondatabase/serverless');

exports.handler = async function (event, context) {
  // 1. Configurar CORS (Para permitir que tu frontend se comunique sin bloqueos)
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  // Manejar peticiones OPTIONS (Preflight de CORS)
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // 2. Conectar a Neon DB usando la variable de entorno
    const sql = neon(process.env.DATABASE_URL);
    const method = event.httpMethod;

    // ==========================================
    // MÉTODO GET: LEER TODOS LOS PRODUCTOS
    // ==========================================
    if (method === 'GET') {
      const result = await sql`SELECT * FROM products ORDER BY id DESC;`;
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ status: 'success', data: result }),
      };
    }

    // ==========================================
    // PARSEAR EL BODY PARA POST, PUT y DELETE
    // ==========================================
    let body = {};
    if (event.body) {
      body = JSON.parse(event.body);
    }
    
    // Tu frontend envía { data: productData } en POST/PUT, así que lo extraemos
    const p = body.data || body;

    // ==========================================
    // MÉTODO POST: CREAR NUEVO PRODUCTO
    // ==========================================
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
        body: JSON.stringify({ status: 'success', message: 'Producto creado', id: result[0].id }),
      };
    }

    // ==========================================
    // MÉTODO PUT: EDITAR PRODUCTO EXISTENTE
    // ==========================================
    if (method === 'PUT') {
      if (!p.id) throw new Error('Se requiere el ID del producto para actualizar.');

      const result = await sql`
        UPDATE products SET
          title = ${p.title},
          description = ${p.description},
          availability = ${p.availability},
          condition = ${p.condition},
          price = ${p.price},
          sale_price = ${p.sale_price || null},
          link = ${p.link},
          image_link = ${p.image_link},
          brand = ${p.brand},
          quantity_to_sell_on_facebook = ${p.quantity_to_sell_on_facebook},
          gtin = ${p.gtin || null},
          barcode = ${p.barcode || null},
          category = ${p.category || null},
          wholesale_price = ${p.wholesale_price || null},
          purchase_price = ${p.purchase_price || null},
          foto_1 = ${p.foto_1 || null},
          foto_2 = ${p.foto_2 || null},
          foto_3 = ${p.foto_3 || null},
          foto_4 = ${p.foto_4 || null},
          foto_5 = ${p.foto_5 || null},
          foto_6 = ${p.foto_6 || null},
          foto_7 = ${p.foto_7 || null}
        WHERE id = ${p.id}
        RETURNING id;
      `;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ status: 'success', message: 'Producto actualizado exitosamente', id: result[0].id }),
      };
    }

    // ==========================================
    // MÉTODO DELETE: ELIMINAR PRODUCTO
    // ==========================================
    if (method === 'DELETE') {
      const productId = body.id;
      if (!productId) throw new Error('Se requiere el ID del producto para eliminar.');

      await sql`DELETE FROM products WHERE id = ${productId};`;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ status: 'success', message: 'Producto eliminado permanentemente' }),
      };
    }

    // Si llega un método no soportado
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Método no permitido' }),
    };

  } catch (error) {
    console.error('Error en products.js:', error);
    
    // Identificar si es un error de GTIN duplicado (Error de Postgres)
    if (error.code === '23505' && error.message.includes('gtin')) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ status: 'error', message: 'El GTIN ingresado ya existe en otro producto.' }),
      };
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ status: 'error', message: error.message }),
    };
  }
};
