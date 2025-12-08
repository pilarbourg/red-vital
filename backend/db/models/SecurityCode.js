module.exports = (sequelize, DataTypes) => {
  const SecurityCode = sequelize.define("SecurityCode", {
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    codigo: {
      type: DataTypes.STRING,
      allowNull: false
    },
    tipo: {
      type: DataTypes.STRING, // "CAMBIO_CREDENCIALES"
      allowNull: false
    },
    expiracion: {
      type: DataTypes.DATE,
      allowNull: false
    }
  });

  return SecurityCode;
};
