const { Op } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Adresse = sequelize.define('Adresse', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    client_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    nom_adresse: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Adresse'
    },
    adresse: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    complement: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    code_postal: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    ville: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    gouvernorat: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    telephone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    est_principale: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    }
  }, {
    tableName: 'adresse',
    hooks: {
      beforeSave: async (adresse, options) => {
        if (adresse.est_principale) {
          // Update name when marking as primary
          adresse.nom_adresse = 'Adresse Principale';
          
          // Remove "Principale" from other addresses and unmark them as primary
          await Adresse.update(
            { 
              est_principale: false,
              nom_adresse: sequelize.literal(`CASE WHEN nom_adresse = 'Adresse Principale' THEN 'Adresse' ELSE nom_adresse END`)
            },
            {
              where: { 
                client_id: adresse.client_id,
                id: { [Op.ne]: adresse.id }
              },
              transaction: options.transaction
            }
          );
        }
      },
      afterCreate: async (adresse, options) => {
        const count = await Adresse.count({
          where: { client_id: adresse.client_id },
          transaction: options.transaction
        });
        
        // If this is the first address, set it as primary
        if (count === 1) {
          await adresse.update({ 
            est_principale: true,
            nom_adresse: 'Adresse Principale'
          }, { transaction: options.transaction });
        }
      }
    }
  });

  Adresse.associate = (models) => {
    Adresse.belongsTo(models.Client, {
      foreignKey: 'client_id',
      as: 'client'
    });
    Adresse.hasMany(models.Commande, {
      foreignKey: 'adresse_id',
      as: 'commandes'
    });
  };

  return Adresse;
};