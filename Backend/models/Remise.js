module.exports = (sequelize, DataTypes) => {
  const Remise = sequelize.define('Remise', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    libelle: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM(
        'pourcentage', 'fixe', 'quantite', 'cumulatif', 'code_promo',
        'fidelite', 'premier_achat', 'deuxieme_article_remise',
        'bogo', 'taille', 'categorie', 'genre'
      ),
      allowNull: false,
    },
    valeur: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    buy_x: DataTypes.INTEGER,
    get_y: DataTypes.INTEGER,
    date_debut: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    date_fin: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    min_achat: DataTypes.FLOAT,
    empilable: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    automatique: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    code: DataTypes.STRING,
    etat: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    evenement_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'evenements',
        key: 'id'
      }
    }
  }, {
    tableName: 'remise',
  });

  Remise.associate = (models) => {
    // Relations existantes
    Remise.belongsToMany(models.Article, {
      through: models.RemiseArticle,
      foreignKey: 'remise_id',
      as: 'articles',
    });

    Remise.belongsToMany(models.Categorie, {
      through: models.RemiseCategorie,
      foreignKey: 'remise_id',
      as: 'categories',
    });

    Remise.belongsToMany(models.Utilisateur, {
      through: models.RemiseUtilisateur,
      foreignKey: 'remise_id',
      as: 'utilisateurs',
    });

    Remise.belongsToMany(models.Taille, {
      through: models.RemiseTaille,
      foreignKey: 'remise_id',
      as: 'tailles',
    });

    Remise.belongsToMany(models.Genre, {
      through: models.RemiseGenre,
      foreignKey: 'remise_id',
      as: 'genres',
    });

    

    // 💡 Nouvelle relation : Remise liée à un événement
    Remise.belongsTo(models.Evenement, {
      foreignKey: 'evenement_id',
      as: 'evenement',
    });
  };

  return Remise;
};
