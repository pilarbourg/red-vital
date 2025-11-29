const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');

module.exports = (sequelize) => {
  const usuario = sequelize.define('usuario', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    rol: {
        type: DataTypes.ENUM('DONANTE', 'HOSPITAL', 'ADMIN'),
        allowNull: false,
    },
    direccion: DataTypes.STRING,
    telefono: DataTypes.STRING,
    activo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
  },
  {
    hooks: {
        beforeSave: async (u) => { 
            if (u.changed('password')) {
                u.password = await bcrypt.hash(u.password, 10); 
            }
        }
    }
  });

  return usuario;
};
