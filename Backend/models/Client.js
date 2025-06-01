// models/Client.js
module.exports = (sequelize, DataTypes) => {
  const Client = sequelize.define('Client', {
    utilisateur_id: {
      type: DataTypes.UUID,
      primaryKey: true,
    },
    telephone: DataTypes.STRING,
    points_fidelite: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0 // Empêche les points négatifs
      }
    },
    date_derniere_conversion: {
      type: DataTypes.DATE,
      allowNull: true
    },
    newsletter: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    methode_paiement: DataTypes.STRING,
    derniere_connexion: DataTypes.DATE,
  }, {
    tableName: 'client',
  });

  Client.associate = (models) => {
    Client.belongsTo(models.Utilisateur, {
      foreignKey: 'utilisateur_id',
      as: 'utilisateur',
    });
    Client.hasMany(models.Commande, {
      foreignKey: 'client_id',
      as: 'commandes',
    });
    Client.hasMany(models.Adresse, {
      foreignKey: 'client_id',
      as: 'adresses',
    });
      Client.hasMany(models.Coupon, {
    foreignKey: 'client_id',
    as: 'coupons'
  });
      Client.hasMany(models.Avis, {
      foreignKey: 'client_id',
      as: 'avis'
    });
  };
  return Client;
};