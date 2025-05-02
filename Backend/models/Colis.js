module.exports = (sequelize, DataTypes) => {
    const Colis = sequelize.define('Colis', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      commande_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      livreur_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      code_colis: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      poids: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      dimensions: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      contenu: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      statut: {
        type: DataTypes.ENUM('En préparation', 'Prêt à expédier', 'Expédié', 'Livré'),
        defaultValue: 'En préparation',
      },
      date_expedition: DataTypes.DATE,
      date_livraison: DataTypes.DATE,
    }, {
      tableName: 'colis',
    });
  
    Colis.associate = function(models) {
      Colis.belongsTo(models.Commande, {
        foreignKey: 'commande_id',
        as: 'commande',
        onDelete: 'CASCADE'
      });
      
      Colis.belongsTo(models.Livreur, {
        foreignKey: 'livreur_id',
        as: 'livreur',
        onDelete: 'SET NULL'
      });
    };
  
    return Colis;
  };