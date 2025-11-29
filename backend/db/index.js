const { Sequelize } = require('sequelize');
const path = require('path');

const dbPath = path.join(__dirname, 'redvital.db');

// Instancia de Sequelize
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: false,
});

// Importar modelos
const Usuario          = require('./models/usuario')(sequelize);
const Donante          = require('./models/donante')(sequelize);
const Disponibilidad   = require('./models/disponibilidad')(sequelize);
const Cita             = require('./models/cita')(sequelize);
const Donacion         = require('./models/donacion')(sequelize);
const Notificacion     = require('./models/notificacion')(sequelize);
const Hospital         = require('./models/hospital')(sequelize);
const InventarioSangre = require('./models/inventarioSangre')(sequelize);
const Solicitud        = require('./models/solicitud')(sequelize);
const Admin            = require('./models/admin')(sequelize);

// Usuario 1–1 Donante
Usuario.hasOne(Donante, { foreignKey: 'usuario_id' });
Donante.belongsTo(Usuario, { foreignKey: 'usuario_id' });

// Usuario 1–1 Hospital
Usuario.hasOne(Hospital, { foreignKey: 'usuario_id' });
Hospital.belongsTo(Usuario, { foreignKey: 'usuario_id' });

// Usuario 1–1 Admin
Usuario.hasOne(Admin, { foreignKey: 'usuario_id' });
Admin.belongsTo(Usuario, { foreignKey: 'usuario_id' });

// Donante 1–n Disponibilidad
Donante.hasMany(Disponibilidad, { foreignKey: 'donante_id' });
Disponibilidad.belongsTo(Donante, { foreignKey: 'donante_id' });

// Donante 1–n Citas
Donante.hasMany(Cita, { foreignKey: 'donante_id' });
Cita.belongsTo(Donante, { foreignKey: 'donante_id' });

// Hospital 1–n Citas
Hospital.hasMany(Cita, { foreignKey: 'hospital_id' });
Cita.belongsTo(Hospital, { foreignKey: 'hospital_id' });

// Usuario (donante) 1–n Donaciones
Usuario.hasMany(Donacion, { foreignKey: 'usuario_id' });
Donacion.belongsTo(Usuario, { foreignKey: 'usuario_id' });

// Solicitud 1–n Donaciones
Solicitud.hasMany(Donacion, { foreignKey: 'solicitud_id' });
Donacion.belongsTo(Solicitud, { foreignKey: 'solicitud_id' });

// Usuario (donante) 1–n Notificaciones
Usuario.hasMany(Notificacion, { foreignKey: 'usuario_id' });
Notificacion.belongsTo(Usuario, { foreignKey: 'usuario_id' });

// Solicitud 1–n Notificaciones
Solicitud.hasMany(Notificacion, { foreignKey: 'solicitud_id' });
Notificacion.belongsTo(Solicitud, { foreignKey: 'solicitud_id' });

// Hospital 1–n Solicitudes
Hospital.hasMany(Solicitud, { foreignKey: 'hospital_id' });
Solicitud.belongsTo(Hospital, { foreignKey: 'hospital_id' });

// Hospital 1–n InventarioSangre
Hospital.hasMany(InventarioSangre, { foreignKey: 'hospital_id' });
InventarioSangre.belongsTo(Hospital, { foreignKey: 'hospital_id' });

module.exports = {
  sequelize,
  Usuario,
  Donante,
  Disponibilidad,
  Cita,
  Donacion,
  Notificacion,
  Hospital,
  InventarioSangre,
  Solicitud,
  Admin,
};
