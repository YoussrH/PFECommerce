module.exports = (sequelize, DataTypes) => {
  const CommandeRemise = sequelize.define('CommandeRemise', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    commande_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    remise_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    montant: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    }
  }, {
    tableName: 'commande_remises',
    timestamps: false
  });

  CommandeRemise.associate = (models) => {
    CommandeRemise.belongsTo(models.Commande, {
      foreignKey: 'commande_id',
      as: 'commande'
    });
    
    CommandeRemise.belongsTo(models.Remise, {
      foreignKey: 'remise_id',
      as: 'remise'
    });
  };

  return CommandeRemise;
};