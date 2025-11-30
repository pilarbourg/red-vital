const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const cita = sequelize.define('cita', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
    },
    donante_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },

    es_invitado: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    nombre_donante: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    email_donante: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    telefono_donante: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    genero_donante: {
        type: DataTypes.ENUM('MASCULINO', 'FEMENINO', 'OTRO', 'PREFIERO_NO_DECIRLO'),
        allowNull: true,
    },
    dob_donante: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    hospital_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    fecha: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    hora: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    doctor: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    departamento: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    mensaje: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    status: {
        type: DataTypes.ENUM('PENDIENTE', 'CONFIRMADA', 'CANCELADA'),
        allowNull: false,
        defaultValue: 'PENDIENTE',
    },
    fecha_solicitud: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
  });

  return cita;
};
