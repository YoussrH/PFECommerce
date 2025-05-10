module.exports = (sequelize, DataTypes) => {
  const Retour = sequelize.define('Retour', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    commande_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'commande',
        key: 'id'
      }
    },
    colis_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'colis',
        key: 'id'
      }
    },
    motif: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('livreur', 'client', 'systeme'),
      defaultValue: 'livreur',
      allowNull: false
    },
    statut: {
      type: DataTypes.ENUM('en_attente', 'approuve', 'refuse', 'traite'),
      defaultValue: 'en_attente',
      allowNull: false
    },
    motif_refus: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    notes_admin: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    notes_livreur: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    date_demande: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    date_traitement: {
      type: DataTypes.DATE,
      allowNull: true
    },
    traite_par: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'utilisateur',
        key: 'id'
      }
    }
  }, {
    tableName: 'retour',

  });

  Retour.associate = function(models) {
    Retour.belongsTo(models.Commande, {
      foreignKey: 'commande_id',
      as: 'commande',
      onDelete: 'CASCADE'
    });
    
    Retour.belongsTo(models.Colis, {
      foreignKey: 'colis_id',
      as: 'colis',
      onDelete: 'SET NULL'
    });
    
    Retour.belongsTo(models.Utilisateur, {
      foreignKey: 'traite_par',
      as: 'traite_par_utilisateur',
      onDelete: 'SET NULL'
    });
  };

  return Retour;
};