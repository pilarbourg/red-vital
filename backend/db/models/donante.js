const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const donante = sequelize.define('donante', {
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
    nombre: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    apellidos: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    genero: {
        type: DataTypes.ENUM('MASCULINO', 'FEMENINO', 'OTRO', 'PREFIERO_NO_DECIRLO'),
        allowNull: true,
    },
    dob: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    grupo_sanguineo: {
        type: DataTypes.ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
        allowNull: false,
    },
    fecha_ultima_donacion: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    radio_km_periferico: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 10,
    },
    condiciones: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
  });

  return donante;
};
