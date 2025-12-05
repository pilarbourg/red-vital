const express = require('express');
const path = require('path');
const doctoresSeed = require('./seed/doctoresBase.json').doctores;
const { sequelize, Admin, Cita, Disponibilidad, Doctor, Donacion, Donante, Hospital, InventarioSangre, Notificacion, Solicitud, Usuario } = require('./db'); 

const app = express();
const PORT = 3000;

const cors = require("cors");
app.use(cors());

// Carpeta raíz del proyecto (donde está index.html y la carpeta frontend)
const rootDir = path.join(__dirname, '..');

// Para leer JSON más adelante
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
const citasRouter = require('./routes/cita');
app.use('/api', citasRouter);
const donantesRouter = require('./routes/donantes');
app.use('/api', donantesRouter);
const authRouter = require('./routes/auth');
app.use('/api', authRouter);
const hospitalesRouter = require('./routes/hospitales');
app.use('/api', hospitalesRouter);
const doctoresRouter = require('./routes/doctores');
app.use('/api', doctoresRouter);
const adminRouter = require('./routes/admin');
app.use('/api', adminRouter);

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
//creamos datos en la tabla usuario
async function seedUsuarios() {
  const count = await Usuario.count();

  if (count === 0) {
    const nuevoUsuario = await Usuario.create({
      email: "testuser@example.com",
      password: "123456",
      telefono: "600123123",
      direccion: "Calle Mayor 10, Madrid",
      rol: "DONANTE"
    });

    console.log(" Usuario de prueba creado con id:", nuevoUsuario.id);
    return nuevoUsuario.id;
  }

  const firstUser = await Usuario.findOne();
  console.log(`Ya existen ${count} usuarios. Se usará usuario id: ${firstUser.id}`);
  return firstUser.id;
}

//creamos datos en la tabla donante
async function seedDonantes(usuarioId) {
  const count = await Donante.count();

  if (count === 0) {
    await Donante.create({
      usuario_id: usuarioId,  // <-- AHORA SÍ USAMOS el usuario creado
      nombre: "Usuario",
      apellidos: "Test",
      genero: "OTRO",
      dob: "1990-01-01",
      grupo_sanguineo: "O+",
      fecha_ultima_donacion: null,
      radio_km_periferico: 15,
      condiciones: "ninguna"
    });

    console.log(" Donante de prueba creado correctamente ✔");
  } else {
    console.log(`Ya existen ${count} donantes en la BD, no se crea ninguno.`);
  }
}

async function seedNotificaciones(usuarioId) {
  const count = await Notificacion.count();

  if (count === 0) {
    const nuevaNotificacion = await Notificacion.create({
      usuario_id: usuarioId,
      solicitud_id: "1",
      fecha_programada: "2025-12-24",
      grupo_sanguineo: "O+",
      status: "ACEPTADA",
    });

    console.log(" Notificacion de prueba creado con id:", nuevaNotificacion.id);
    return nuevaNotificacion.id;
  }

  const firstNotificacion = await Notificacion.findOne();
  console.log(`Ya existen ${count} notificaciones. Se usará notificacion id: ${firstNotificacion.id}`);
  return firstNotificacion.id;
}

async function seedDonacion() {
  const count = await Donacion.count();

  if (count === 0) {
    const nuevaDonacion = await Donacion.create({
      usuario_id: "1",
      solicitud_id: "1",
      fecha: "2025-12-24",
      cantidad: "450",
    });

    console.log(" Donacion de prueba creado con id:", nuevaDonacion.id);
    return nuevaDonacion.id;
  }

  const firstDonacion = await Donacion.findOne();
  console.log(`Ya existen ${count} donaciones. Se usará donacion id: ${firstDonacion.id}`);
  return firstDonacion.id;
}

async function seedSolicitud() {
  const count = await Solicitud.count();

  if (count === 0) {
    const nuevaSolicitud = await Solicitud.create({
      hospital_id: "1",
      fecha_creacion: "2025-12-01",
      fecha_limite: "2025-12-31",
      grupo_sanguineo: "O+",
      cantidad_unidades: 5,
      comentarios: "Necesitamos donaciones urgentes para cirugía.",
      urgencia: "ALTA",
      estado: "PENDIENTE"
    });

    console.log(" Solicitud de prueba creado con id:", nuevaSolicitud.id);
    return nuevaSolicitud.id;
  }

  const firstSolicitud = await Solicitud.findOne();
  console.log(`Ya existen ${count} solicitud. Se usará solicitud id: ${firstSolicitud.id}`);
  return firstSolicitud.id;
}

async function seedDoctores() {
  const count = await Doctor.count();
  if (count > 0) {
    console.log(`Ya existen ${count} doctores, no se crean nuevos.`);
    return;
  }

  const hospitales = await Hospital.findAll();
  if (!hospitales.length) {
    console.log('No hay hospitales, no se crean doctores.');
    return;
  }

  const docsToCreate = [];

  // Por cada hospital, elegimos un subconjunto aleatorio de doctores del JSON
  hospitales.forEach(h => {
    // copiamos y barajamos la lista base
    const shuffled = [...doctoresSeed].sort(() => Math.random() - 0.5);

    // cuántos doctores quieres por hospital (por ejemplo entre 4 y todos)
    const min = 20;
    const max = doctoresSeed.length;
    const n = Math.max(min, Math.floor(Math.random() * (max - min + 1)) + min);

    const subset = shuffled.slice(0, n);

    subset.forEach(d => {
      docsToCreate.push({
        nombre: d.nombre,
        departamento: d.departamento,
        hospital_id: h.id,
      });
    });
  });

  await Doctor.bulkCreate(docsToCreate);
  console.log(`Semilla: creados ${docsToCreate.length} doctores`);
}



// Sincronizar la BD y luego arrancar el servidor
sequelize.sync({ force: true })
  .then(async () => {
    console.log('Base de datos sincronizada');

    // Crear datos iniciales (hospitales de prueba)
    await seedInitialData();
    const usuarioId = await seedUsuarios();  
    await seedDonantes(usuarioId);
    await seedSolicitud();
    await seedNotificaciones(usuarioId);
    await seedDonacion();
    await seedDoctores(); 

    app.listen(PORT, () => {
      console.log(`Servidor backend escuchando en http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error al sincronizar la base de datos:', error);
  });


module.exports = app;