// models/Avis.js
module.exports = (sequelize, DataTypes) => {
  const Avis = sequelize.define("Avis", {
    note: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1, max: 5 },
    },
    commentaire: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    client_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'client',
        key: 'utilisateur_id'
      }
    },
    article_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'article',
        key: 'id'
      }
    }
  }, {
    tableName: 'avis',
    timestamps: true,
  });

// In your Avis model file (models/Avis.js)
Avis.associate = (models) => {
  Avis.belongsTo(models.Client, { 
    foreignKey: 'client_id',
    as: 'client'  // Changed from 'Client' to 'client'
  });
  Avis.belongsTo(models.Article, { 
    foreignKey: 'article_id',
    as: 'article'
  });
};

  return Avis;
};