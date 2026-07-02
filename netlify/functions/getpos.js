const { neon } = require('@neondatabase/serverless');

exports.handler = async function (event, context) {
  // 1. Configurar CORS
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
    // 2. Conectar a Neon DB
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
    
    // El frontend envía { data: productData } en POST/PUT
    const p = body.data || body;

    // Función auxiliar para convertir strings vacíos a null (evita errores en numéricos)
    const clean = (val) => (val === '' ? null : (val ?? null));

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
          ${p.title}, ${p.description}, ${p.availability}, ${p.condition}, ${p.price}, ${clean(p.sale_price)},
          ${p.link}, ${p.image_link}, ${p.brand}, ${p.quantity_to_sell_on_facebook ?? 0}, ${clean(p.gtin)}, ${clean(p.barcode)},
          ${clean(p.category)}, ${clean(p.wholesale_price)}, ${clean(p.purchase_price)},
          ${clean(p.foto_1)}, ${clean(p.foto_2)}, ${clean(p.foto_3)}, ${clean(p.foto_4)}, ${clean(p.foto_5)}, ${clean(p.foto_6)}, ${clean(p.foto_7)}
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
          sale_price = ${clean(p.sale_price)},
          link = ${p.link},
          image_link = ${p.image_link},
          brand = ${p.brand},
          quantity_to_sell_on_facebook = ${p.quantity_to_sell_on_facebook ?? 0},
          gtin = ${clean(p.gtin)},
          barcode = ${clean(p.barcode)},
          category = ${clean(p.category)},
          wholesale_price = ${clean(p.wholesale_price)},
          purchase_price = ${clean(p.purchase_price)},
          foto_1 = ${clean(p.foto_1)},
          foto_2 = ${clean(p.foto_2)},
          foto_3 = ${clean(p.foto_3)},
          foto_4 = ${clean(p.foto_4)},
          foto_5 = ${clean(p.foto_5)},
          foto_6 = ${clean(p.foto_6)},
          foto_7 = ${clean(p.foto_7)}
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
    console.error('Error en getpos.js:', error);
    
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
