const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const notificacion = sequelize.define('notificacion', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
    },
    usuario_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    solicitud_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    titulo: DataTypes.STRING,
    tipo: DataTypes.STRING, 
    fecha_programada: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    grupo_sanguineo: {
        type: DataTypes.ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
        allowNull: false,
    },
    mensaje: DataTypes.TEXT,
    status: {
        type: DataTypes.ENUM('ENVIADA', 'LEIDA', 'ACEPTADA', 'RECHAZADA', 'EXPIRADA'),
        allowNull: false,
        defaultValue: 'ENVIADA',
    },
  });

  return notificacion;
};
