const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const disponibilidad = sequelize.define('disponibilidad', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
    },
    donante_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    estado: {
        type: DataTypes.ENUM('DISPONIBLE', 'NO_DISPONIBLE', 'PENDIENTE'),
        allowNull: false,
        defaultValue: 'DISPONIBLE',
    },
    fecha_envio: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    fecha_respuesta: {
        type: DataTypes.DATE,
        allowNull: true,
    },
  });

  return disponibilidad;
};
