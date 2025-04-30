module.exports = (sequelize, DataTypes) => {
  const RemiseUtilisateur = sequelize.define('RemiseUtilisateur', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    remise_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    utilisateur_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  }, {
    tableName: 'remise_utilisateur',
  });

  RemiseUtilisateur.associate = (models) => {
    RemiseUtilisateur.belongsTo(models.Remise, {
      foreignKey: 'remise_id',
      as: 'remise',
    });
    RemiseUtilisateur.belongsTo(models.Utilisateur, {
      foreignKey: 'utilisateur_id',
      as: 'utilisateur',
    });
  };

  return RemiseUtilisateur;
};