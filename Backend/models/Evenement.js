// models/evenement.js
module.exports = (sequelize, DataTypes) => {
  const Evenement = sequelize.define('Evenement', {
    nom: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    date_debut: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: true
      }
    },
    date_fin: {
      type: DataTypes.DATEONLY,
      validate: {
        isDate: true
      }
    },
    type_evenement: {
      type: DataTypes.ENUM(
        'Rentrée scolaire',
        'Fête religieuse',
        'Événement commercial', // <-- Ensure this is in the ENUM
        'Fête nationale',
        'Saison commercial' // <-- New type for things like 'Summer Time'
      ),
      allowNull: false
    },
    recurrence: {
      type: DataTypes.ENUM('fixe', 'variable'),
      allowNull: false
    },
    est_actif: {
      type: DataTypes.BOOLEAN,
      defaultValue: false // Default to false, can be activated manually or via logic
    },
    annee: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    est_approximatif: { // Add this field for religious events from Aladhan
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'evenements',
    timestamps: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    indexes: [{
      fields: ['nom', 'annee'], // Index by nom and annee for uniqueness per year
      unique: true
    }]
  });

  Evenement.associate = (models) => {
    Evenement.hasMany(models.Remise, {
      foreignKey: 'evenement_id',
      as: 'remises',
      onDelete: 'SET NULL' // or CASCADE if you want to delete related remises
    });
  };

  return Evenement;
};