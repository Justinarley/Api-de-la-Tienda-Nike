const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'Tienda Nike',
  password: '2003',
  port: 5432,
});

const app = express();
app.set('port', process.env.PORT || 3000);
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Ruta para registrar un nuevo usuario
app.post('/register', async (req, res) => {
  const { email, password, cedula, nombres, apellidos, fecha_nacimiento, genero, estado_civil, terminos_aceptados } = req.body;

  try {
    // Iniciar una transacción
    await pool.query('BEGIN');

    // Insertar en la tabla user_details
    await pool.query(
      `INSERT INTO user_details (cedula, nombres, apellidos, email, password, fecha_nacimiento, genero, estado_civil, terminos_aceptados) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [cedula, nombres, apellidos, email, password, fecha_nacimiento, genero, estado_civil, terminos_aceptados]
    );

    // Insertar en la tabla user
    await pool.query(
      `INSERT INTO users (email, password) 
       VALUES ($1, $2)`,
      [email, password]
    );

    // Confirmar la transacción
    await pool.query('COMMIT');

    res.status(201).send('Usuario registrado exitosamente');
  } catch (error) {
    // Revertir la transacción en caso de error
    await pool.query('ROLLBACK');
    console.error(error);
    res.status(500).send('Error registrando usuario');
  }
});
// Ruta para el inicio de sesión
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Consultar el usuario por su email en la tabla users
    const result = await pool.query(
      `SELECT users.*, user_details.nombres, user_details.apellidos 
       FROM users 
       INNER JOIN user_details ON users.email = user_details.email 
       WHERE users.email = $1`,
      [email]
    );

    // Verificar si se encontró un usuario con ese email
    if (result.rows.length === 1) {
      const user = result.rows[0];

      // Validar la contraseña
      if (user.password === password) {
        res.status(200).json({ success: true, name: user.nombres, lastName: user.apellidos });
      } else {
        res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
      }
    } else {
      res.status(401).json({ success: false, message: 'Correo electrónico no registrado' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Error de servidor');
  }
});



app.listen(app.get('port'), () => {
  console.log('Listening on port', app.get('port'));
});
