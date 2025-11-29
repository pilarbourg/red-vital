const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const solicitud = sequelize.define('solicitud', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
    },
    hospital_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    fecha_creacion: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    fecha_limite: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    grupo_sanguineo: {
        type: DataTypes.ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
        allowNull: false,
    },
    cantidad_unidades: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
    },
    comentarios:{
        type:DataTypes.TEXT,
        allowNull: true,
    },
    urgencia: {
        type: DataTypes.ENUM('BAJA', 'MEDIA', 'ALTA'),
        allowNull: false,
        defaultValue: 'MEDIA',
    },
    estado: {
        type: DataTypes.ENUM('PENDIENTE', 'PARCIAL', 'CUBIERTA', 'CANCELADA'),
        allowNull: false,
        defaultValue: 'PENDIENTE',
    },
  });

  return solicitud;
};
