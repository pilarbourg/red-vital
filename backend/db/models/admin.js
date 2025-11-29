 const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const admin = sequelize.define('admin', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
    },
  });

  return admin;
};
