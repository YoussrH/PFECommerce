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
        'Événement commercial',
        'Fête nationale'
      ),
      allowNull: false
    },
    recurrence: {
      type: DataTypes.ENUM('fixe', 'variable'),
      allowNull: false
    },
    est_actif: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    annee: {  // Added year field to track the year separately
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    tableName: 'evenements',
    timestamps: true,
    charset: 'utf8mb4', // Ensure proper character encoding
    collate: 'utf8mb4_unicode_ci',
    indexes: [{
      fields: ['nom', 'date_debut'],
      unique: true
    }]
  });
  Evenement.associate = (models) => {
    Evenement.hasMany(models.Remise, {
      foreignKey: 'evenement_id',
      as: 'remises',
      onDelete: 'SET NULL' // ou CASCADE si tu veux supprimer les remises liées
    });
  };
  

  return Evenement;
};