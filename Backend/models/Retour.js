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
      },
      motif: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM('Retour simple', 'Remplacement', 'Remboursement'),
        allowNull: false,
      },
      statut: {
        type: DataTypes.ENUM('En cours', 'Accepté', 'Refusé', 'Clôturé'),
        defaultValue: 'En cours',
      },
      motif_refus: DataTypes.TEXT,
      notes_admin: DataTypes.TEXT,
      date_demande: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      date_traitement: DataTypes.DATE,
      traite_par: DataTypes.UUID,
    }, {
      tableName: 'retour',
    });
  
    Retour.associate = function(models) {
      Retour.belongsTo(models.Commande, {
        foreignKey: 'commande_id',
        as: 'commande',
        onDelete: 'CASCADE'
      });
      
      Retour.belongsTo(models.Utilisateur, {
        foreignKey: 'traite_par',
        as: 'traite_par_utilisateur',
        onDelete: 'SET NULL'
      });
    };
  
    return Retour;
  };