const express = require('express');
const path = require('path');
const { sequelize, Admin, Cita, Disponibilidad, Doctor, Donacion, Donante, Hospital, InventarioSangre, Notificacion, Solicitud, Usuario } = require('./db'); 

const app = express();
const PORT = 3000;

// Carpeta raíz del proyecto (donde está index.html y la carpeta frontend)
const rootDir = path.join(__dirname, '..');

// Para leer JSON más adelante
app.use(express.json());

app.use(express.static(rootDir));

// Ruta principal: devolver index.html de la raíz
app.get('/', (req, res) => {
  res.sendFile(path.join(rootDir, 'index.html'));
});

// Ruta de prueba de la API
app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'API Gestor de Donaciones funcionando...' });
});

// Rutas de las APIs
const citasRouter = require('./routes/citas');
app.use('/api', citasRouter);
const donantesRouter = require('./routes/donantes');
//app.use('/api', donantesRouter);
//const authRouter = require('./routes/auth');
//app.use('/api', authRouter);
const hospitalesRouter = require('./routes/hospitales');
app.use('/api', hospitalesRouter);
const doctoresRouter = require('./routes/doctores');
app.use('/api', doctoresRouter);

//creamos datos en la tabla hospital
async function seedInitialData() {
  const hospitalCount = await Hospital.count();
  if (hospitalCount === 0) {
    await Hospital.bulkCreate([
      {
        nombre: 'Hospital Central',
        direccion: 'C/ Principal 1',
        ciudad: 'Madrid',
        usuario_id: null, 
      },
      {
        nombre: 'Clínica Norte',
        direccion: 'Av. Norte 12',
        ciudad: 'Madrid',
        usuario_id: null,
      },
    ]);
    console.log('Semilla: hospitales de prueba creados');
  } else {
    console.log('Semilla: ya hay ${hospitalCount} hospitales, no se crean nuevos');
  }
}


// Sincronizar la BD y luego arrancar el servidor
sequelize.sync({ alter: true })
  .then(async () => {
    console.log('Base de datos sincronizada');

    // Crear datos iniciales (hospitales de prueba)
    await seedInitialData();

    app.listen(PORT, () => {
      console.log(`Servidor backend escuchando en http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error al sincronizar la base de datos:', error);
  });


module.exports = app;
