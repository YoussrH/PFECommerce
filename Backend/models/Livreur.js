// models/Livreur.js
module.exports = (sequelize, DataTypes) => {
    const Livreur = sequelize.define('Livreur', {
      utilisateur_id: {
        type: DataTypes.UUID,
        primaryKey: true,
      },
      telephone: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      statut: {
        type: DataTypes.ENUM('actif', 'inactif', 'en_conge', 'en_livraison'),
        defaultValue: 'actif',
      },
      type_vehicule: {
        type: DataTypes.ENUM('voiture', 'moto', 'velo', 'camionnette'),
        allowNull: false,
      },
      plaque_immatriculation: DataTypes.STRING,
      capacite_max: {
        type: DataTypes.FLOAT,
        defaultValue: 10, // kg
      },
      zone_livraison: DataTypes.STRING, // JSON array of postal codes
      note_moyenne: {
        type: DataTypes.FLOAT,
        defaultValue: 5,
      },
      est_certifie: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      derniere_connexion: DataTypes.DATE,
    }, {
      tableName: 'livreur',
      timestamps: false,
    });
  
    Livreur.associate = (models) => {
      Livreur.belongsTo(models.Utilisateur, {
        foreignKey: 'utilisateur_id',
        as: 'utilisateur',
      });
      Livreur.hasMany(models.Commande, {
        foreignKey: 'livreur_id',
        as: 'commandes',
      });
      Livreur.hasMany(models.LivreurLocalisation, {
        foreignKey: 'livreur_id',
        as: 'localisations',
      });
    };
  
    return Livreur;
  };