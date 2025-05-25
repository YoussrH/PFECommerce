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
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
          const rawValue = this.getDataValue('fichiers');
          try {
            if (!rawValue) return [];
            if (typeof rawValue === 'string') {
              const parsed = JSON.parse(rawValue);
              return Array.isArray(parsed) ? parsed : [parsed];
            }
            return Array.isArray(rawValue) ? rawValue : [];
          } catch (e) {
            console.error('Error parsing fichiers:', e);
            return [];
          }
        },
        set(value) {
          try {
            const serialized = value && value.length > 0 ? JSON.stringify(value) : null;
            this.setDataValue('fichiers', serialized);
          } catch (e) {
            console.error('Error serializing fichiers:', e);
            this.setDataValue('fichiers', null);
          }
        },
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
    },
        reponse: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    date_reponse: {
      type: DataTypes.DATE,
      allowNull: true
    },
    admin_id: {
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