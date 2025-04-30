// models/CommandeHistorique.js
module.exports = (sequelize, DataTypes) => {
    const CommandeHistorique = sequelize.define('CommandeHistorique', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      commande_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      utilisateur_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      action: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      ancienne_valeur: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      nouvelle_valeur: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      details: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    }, {
      tableName: 'commande_historique',
    });
  
    CommandeHistorique.associate = (models) => {
      CommandeHistorique.belongsTo(models.Commande, {
        foreignKey: 'commande_id',
        as: 'commande',
      });
      CommandeHistorique.belongsTo(models.Utilisateur, {
        foreignKey: 'utilisateur_id',
        as: 'utilisateur',
      });
    };
  
    return CommandeHistorique;
  };