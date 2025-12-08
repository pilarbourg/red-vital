// DATABASE SEEDING

const doctoresSeed = require("./seed/doctoresBase.json").doctores;

const {
  Admin,
  Cita,
  Disponibilidad,
  Doctor,
  Donacion,
  Donante,
  Hospital,
  InventarioSangre,
  Notificacion,
  Solicitud,
  Usuario,
} = require("./db");

async function seedInitialData() {
  const hospitalCount = await Hospital.count();
  if (hospitalCount === 0) {
    await Hospital.bulkCreate([
      {
        nombre: "Hospital Central",
        direccion: "C/ Principal 1",
        ciudad: "Madrid",
        usuario_id: null,
      },
      {
        nombre: "Clínica Norte",
        direccion: "Av. Norte 12",
        ciudad: "Madrid",
        usuario_id: null,
      },
    ]);
    console.log("Semilla: hospitales de prueba creados");
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
      rol: "DONANTE",
    });

    console.log(" Usuario de prueba creado con id:", nuevoUsuario.id);
    return nuevoUsuario.id;
  }

  const firstUser = await Usuario.findOne();
  console.log(
    `Ya existen ${count} usuarios. Se usará usuario id: ${firstUser.id}`
  );
  return firstUser.id;
}

//creamos datos en la tabla donante
async function seedDonantes(usuarioId) {
  const count = await Donante.count();

  if (count === 0) {
    await Donante.create({
      usuario_id: usuarioId, // <-- AHORA SÍ USAMOS el usuario creado
      nombre: "Usuario",
      apellidos: "Test",
      genero: "OTRO",
      dob: "1990-01-01",
      grupo_sanguineo: "O+",
      fecha_ultima_donacion: null,
      radio_km_periferico: 15,
      condiciones: "ninguna",
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
  console.log(
    `Ya existen ${count} notificaciones. Se usará notificacion id: ${firstNotificacion.id}`
  );
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
  console.log(
    `Ya existen ${count} donaciones. Se usará donacion id: ${firstDonacion.id}`
  );
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
      estado: "PENDIENTE",
    });

    console.log(" Solicitud de prueba creado con id:", nuevaSolicitud.id);
    return nuevaSolicitud.id;
  }

  const firstSolicitud = await Solicitud.findOne();
  console.log(
    `Ya existen ${count} solicitud. Se usará solicitud id: ${firstSolicitud.id}`
  );
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
    console.log("No hay hospitales, no se crean doctores.");
    return;
  }

  const docsToCreate = [];

  // Por cada hospital, elegimos un subconjunto aleatorio de doctores del JSON
  hospitales.forEach((h) => {
    // copiamos y barajamos la lista base
    const shuffled = [...doctoresSeed].sort(() => Math.random() - 0.5);

    // cuántos doctores quieres por hospital (por ejemplo entre 4 y todos)
    const min = 20;
    const max = doctoresSeed.length;
    const n = Math.max(min, Math.floor(Math.random() * (max - min + 1)) + min);

    const subset = shuffled.slice(0, n);

    subset.forEach((d) => {
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

async function seedAll() {
  await seedInitialData();
  const usuarioId = await seedUsuarios();
  await seedDonantes(usuarioId);
  await seedSolicitud();
  await seedNotificaciones(usuarioId);
  await seedDonacion();
  await seedDoctores();
}

module.exports = { seedAll };
