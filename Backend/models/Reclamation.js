// models/Reclamation.js
module.exports = (sequelize, DataTypes) => {
  const Reclamation = sequelize.define('Reclamation', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    prefix: {
      type: DataTypes.ENUM('Madame', 'Monsieur', 'Mlle'),
      allowNull: true
    },
    nom: {
      type: DataTypes.STRING,
      allowNull: true
    },
    prenom: {
      type: DataTypes.STRING,
      allowNull: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    telephone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    sujet: {
      type: DataTypes.STRING,
      allowNull: false
    },
    numero_commande: {
      type: DataTypes.STRING,
      allowNull: true
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    fichiers: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true
    },
    statut: {
      type: DataTypes.ENUM('nouveau', 'brouillon', 'traite', 'archive'),
      defaultValue: 'nouveau'
    },
    type_reclamation: {
      type: DataTypes.ENUM('annulation', 'remplacement', 'question', 'probleme'),
      allowNull: true
    },
    commande_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'commande',
        key: 'id'
      }
    },
    utilisateur_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'utilisateur',
        key: 'id'
      }
    }
  }, {
    tableName: 'reclamation',
    timestamps: true,
    createdAt: 'date_creation',
    updatedAt: 'date_modification'
  });

  Reclamation.associate = (models) => {
    Reclamation.belongsTo(models.Utilisateur, {
      foreignKey: 'utilisateur_id',
      as: 'utilisateur'
    });
    Reclamation.belongsTo(models.Commande, {
      foreignKey: 'commande_id',
      as: 'commande'
    });
  };

  return Reclamation;
}; 