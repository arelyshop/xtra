const { neon } = require('@neondatabase/serverless');

exports.handler = async function (event, context) {
  // Configurar CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Manejar peticiones OPTIONS (Preflight)
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Solo permitir POST para el login
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, message: 'Método no permitido' })
    };
  }

  try {
    // Conectar a Neon DB
    const sql = neon(process.env.DATABASE_URL);
    
    // Parsear credenciales
    const { username, password } = JSON.parse(event.body);

    if (!username || !password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, message: 'Usuario y contraseña son requeridos.' })
      };
    }

    // Consultar la tabla 'users'
    // Nota de seguridad: Se asume que las contraseñas están en texto plano en la BD según tu solicitud.
    // Para producción en el futuro, es recomendable usar hashes (como bcrypt).
    const result = await sql`
      SELECT id, username 
      FROM users 
      WHERE username = ${username} AND password = ${password} 
      LIMIT 1;
    `;

    // Validar si existe el usuario
    if (result.length > 0) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: true, 
          message: 'Login exitoso', 
          user: result[0] 
        }),
      };
    } else {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ success: false, message: 'Usuario o contraseña incorrectos.' }),
      };
    }

  } catch (error) {
    console.error('Error en login.js:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, message: 'Error interno del servidor.' }),
    };
  }
};
