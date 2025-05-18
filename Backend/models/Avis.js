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
  });

  Avis.associate = (models) => {
    Avis.belongsTo(models.Utilisateur, { foreignKey: "utilisateurId" });
    Avis.belongsTo(models.Article, { foreignKey: "articleId" });
  };

  return Avis;
};
