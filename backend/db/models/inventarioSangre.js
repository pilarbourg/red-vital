const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const inventarioSangre = sequelize.define('inventarioSangre', {
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
    grupo_sanguineo: {
        type: DataTypes.ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
        allowNull: false,
    },
    unidades_disponibles: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    fecha_ultima_actualizacion: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
  });

  return inventarioSangre;
};
