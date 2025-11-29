const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const donacion = sequelize.define('donacion', {
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
        allowNull: false,
    },
    fecha: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    cantidad: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 450,    
    },
  });

  return donacion;
};
