module.exports = function(models) {
  try {
    console.log('Setting up model relations...');
    
    // Verify all required models exist
    const requiredModels = [
      'Remise', 'Article', 'Categorie', 'Genre', 'Taille', 'Client', 'Evenement', 'ImageArticleCouleur',
      'Marque', 'Couleur', 'Commande', 'Panier', 'RemiseArticle', 'AjustementStock', 'Livreur',
      'RemiseCategorie', 'RemiseUtilisateur', 'RemiseTaille', 'RemiseGenre', 'LivreurLocalisation',
      'CommandeArticle', 'ArticlePanier', 'Adresse', 'ArticleCouleur', 'ArticleTaille', 'Utilisateur',
      'Facture','ListeEnvies','Coupon', 'CommandeHistorique', 'Colis', 'Retour', 'HistoriqueAction'
    ];

    // Check model availability
    const missingModels = requiredModels.filter(name => !models[name]);
    if (missingModels.length > 0) {
      throw new Error(`Missing models: ${missingModels.join(', ')}`);
    }

    // Destructure models after verification
    const {
      Coupon,
      Adresse,
      ImageArticleCouleur,
      Remise,
      AjustementStock,
      Article,
      Categorie,
      Genre,
      Taille,
      Client,
      Livreur,
      LivreurLocalisation,
      Marque,
      Couleur,
      Commande,
      Panier,
      RemiseArticle,
      RemiseCategorie,
      RemiseUtilisateur,
      RemiseTaille,
      RemiseGenre,
      CommandeArticle,
      ArticlePanier,
      ArticleCouleur,
      ArticleTaille,
      Utilisateur,
      Evenement,
      HistoriqueAction,
      Facture,
      CommandeHistorique,
      Colis,
      Retour,
      ListeEnvies
    } = models;

    /* ==============================================
     * 1. DISCOUNT/REMISE RELATIONS
     * ============================================== */
    Remise.belongsToMany(Article, {
      through: RemiseArticle,
      foreignKey: 'remise_id',
      as: 'articles',
      onDelete: 'CASCADE'
    });

    Article.belongsToMany(Remise, {
      through: RemiseArticle,
      foreignKey: 'article_id',
      as: 'remises',
      onDelete: 'CASCADE'
    });

    Remise.belongsToMany(Categorie, {
      through: RemiseCategorie,
      foreignKey: 'remise_id',
      as: 'categories',
      onDelete: 'CASCADE'
    });

    Categorie.belongsToMany(Remise, {
      through: RemiseCategorie,
      foreignKey: 'categorie_id',
      as: 'remises',
      onDelete: 'CASCADE'
    });

    Remise.belongsToMany(Utilisateur, {
      through: RemiseUtilisateur,
      foreignKey: 'remise_id',
      as: 'utilisateurs',
      onDelete: 'CASCADE'
    });

    Utilisateur.belongsToMany(Remise, {
      through: RemiseUtilisateur,
      foreignKey: 'utilisateur_id',
      as: 'remises',
      onDelete: 'CASCADE'
    });

    Remise.belongsToMany(Genre, {
      through: RemiseGenre,
      foreignKey: 'remise_id',
      as: 'genres',
      onDelete: 'CASCADE'
    });
    
    Genre.belongsToMany(Remise, {
      through: RemiseGenre,
      foreignKey: 'genre_id',
      as: 'remises',
      onDelete: 'CASCADE'
    });

    Remise.belongsToMany(Taille, {
      through: RemiseTaille,
      foreignKey: 'remise_id',
      as: 'tailles',
      onDelete: 'CASCADE'
    });
    
    Taille.belongsToMany(Remise, {
      through: RemiseTaille,
      foreignKey: 'taille_id',
      as: 'remises',
      onDelete: 'CASCADE'
    });

    /* ==============================================
     * 2. CATEGORY RELATIONS
     * ============================================== */
    Categorie.hasMany(Categorie, {
      as: 'sous_categories',
      foreignKey: 'parent_id',
      onDelete: 'CASCADE'
    });

    Categorie.belongsTo(Categorie, {
      as: 'parent',
      foreignKey: 'parent_id'
    });

    Categorie.hasMany(Article, {
      foreignKey: 'categorie_id',
      as: 'articles',
      onDelete: 'CASCADE'
    });

    /* ==============================================
     * 3. ARTICLE RELATIONS
     * ============================================== */
    Article.belongsTo(Categorie, {
      foreignKey: 'categorie_id',
      as: 'categorie',
      onDelete: 'CASCADE'
    });

    Article.belongsTo(Marque, {
      foreignKey: 'marque_id',
      as: 'marque',
      onDelete: 'CASCADE'
    });

    Article.belongsTo(Genre, {
      foreignKey: 'genre_id',
      as: 'genre',
      onDelete: 'CASCADE'
    });

    Article.hasMany(ArticleTaille, {
      foreignKey: 'article_id',
      as: 'inventory',
      onDelete: 'CASCADE'
    });

    Article.belongsToMany(Taille, {
      through: ArticleTaille,
      foreignKey: 'article_id',
      as: 'tailles',
      onDelete: 'CASCADE'
    });

    Article.belongsToMany(Couleur, {
      through: ArticleCouleur,
      foreignKey: 'article_id',
      as: 'couleurs',
      onDelete: 'CASCADE'
    });

    /* ==============================================
     * 4. ARTICLE-TAILLE RELATIONS
     * ============================================== */
    ArticleTaille.belongsTo(Article, {
      foreignKey: 'article_id',
      as: 'article',
      onDelete: 'CASCADE'
    });

    ArticleTaille.belongsTo(Taille, {
      foreignKey: 'taille_id',
      as: 'taille',
      onDelete: 'CASCADE'
    });

    ArticleTaille.belongsTo(Couleur, {
      foreignKey: 'couleur_id',
      as: 'couleur',
      onDelete: 'CASCADE'
    });

    Taille.belongsToMany(Article, {
      through: ArticleTaille,
      foreignKey: 'taille_id',
      as: 'articles',
      onDelete: 'CASCADE'
    });

    Taille.hasMany(ArticleTaille, {
      foreignKey: 'taille_id',
      as: 'article_tailles',
      onDelete: 'CASCADE'
    });

    Couleur.hasMany(ArticleTaille, {
      foreignKey: 'couleur_id',
      as: 'article_tailles',
      onDelete: 'CASCADE'
    });

    /* ==============================================
     * 5. ARTICLE-COULEUR RELATIONS
     * ============================================== */
    ArticleCouleur.belongsTo(Article, {
      foreignKey: 'article_id',
      as: 'article'
    });

    ArticleCouleur.belongsTo(Couleur, {
      foreignKey: 'couleur_id',
      as: 'couleur'
    });

    Couleur.hasMany(ArticleCouleur, {
      foreignKey: 'couleur_id',
      as: 'article_couleurs',
      onDelete: 'CASCADE'
    });

    /* ==============================================
     * 6. MARQUE & GENRE RELATIONS
     * ============================================== */
    Marque.hasMany(Article, {
      foreignKey: 'marque_id',
      as: 'articles',
      onDelete: 'CASCADE'
    });

    Genre.hasMany(Article, {
      foreignKey: 'genre_id',
      as: 'articles',
      onDelete: 'CASCADE'
    });

    /* ==============================================
     * 7. TAILLE RELATIONS
     * ============================================== */
    Taille.belongsTo(Categorie, {
      foreignKey: 'categorie_id',
      as: 'categorie',
      onDelete: 'CASCADE'
    });

    Taille.belongsTo(Genre, {
      foreignKey: 'genre_id',
      as: 'genre',
      onDelete: 'CASCADE'
    });

    /* ==============================================
     * 8. PANIER RELATIONS
     * ============================================== */
    Panier.belongsTo(Utilisateur, {
      foreignKey: 'utilisateur_id',
      as: 'utilisateur',
      onDelete: 'CASCADE'
    });

    Utilisateur.hasOne(Panier, {
      foreignKey: 'utilisateur_id',
      as: 'panier',
      onDelete: 'CASCADE'
    });

    Panier.belongsToMany(Article, {
      through: ArticlePanier,
      foreignKey: 'panier_id',
      as: 'articles',
      onDelete: 'CASCADE'
    });

    Article.belongsToMany(Panier, {
      through: ArticlePanier,
      foreignKey: 'article_id',
      as: 'paniers',
      onDelete: 'CASCADE'
    });

    ArticlePanier.belongsTo(Panier, {
      foreignKey: 'panier_id',
      as: 'panier'
    });

    ArticlePanier.belongsTo(Article, {
      foreignKey: 'article_id',
      as: 'article'
    });

    Panier.hasMany(ArticlePanier, {
      foreignKey: 'panier_id',
      as: 'panier_articles',
      onDelete: 'CASCADE'
    });

    Article.hasMany(ArticlePanier, {
      foreignKey: 'article_id',
      as: 'panier_articles',
      onDelete: 'CASCADE'
    });

    ArticlePanier.belongsTo(Couleur, {
      foreignKey: 'couleur_id',
      as: 'couleur'
    });

    ArticlePanier.belongsTo(Taille, {
      foreignKey: 'taille_id',
      as: 'taille'
    });

    /* ==============================================
     * 9. COMMANDE RELATIONS
     * ============================================== */
    Commande.belongsTo(Client, {
      foreignKey: 'client_id',
      as: 'client',
      onDelete: 'CASCADE'
    });
  
    Client.hasMany(Commande, {
      foreignKey: 'client_id',
      as: 'commandes',
      onDelete: 'CASCADE'
    });
  
    Commande.belongsTo(Livreur, {
      foreignKey: 'livreur_id',
      as: 'livreur',
      onDelete: 'SET NULL'
    });
  
    Livreur.hasMany(Commande, {
      foreignKey: 'livreur_id',
      as: 'commandes',
      onDelete: 'SET NULL'
    });
  
    Commande.hasMany(CommandeArticle, {
      foreignKey: 'commande_id',
      as: 'commande_articles',
      onDelete: 'CASCADE'
    });
  
    CommandeArticle.belongsTo(Commande, {
      foreignKey: 'commande_id',
      as: 'commande',
      onDelete: 'CASCADE'
    });
  
    Commande.belongsToMany(Article, {
      through: CommandeArticle,
      foreignKey: 'commande_id',
      as: 'articles',
      onDelete: 'CASCADE'
    });
  
    Article.belongsToMany(Commande, {
      through: CommandeArticle,
      foreignKey: 'article_id',
      as: 'commandes',
      onDelete: 'CASCADE'
    });
  
    CommandeArticle.belongsTo(Article, {
      foreignKey: 'article_id',
      as: 'article'
    });

    /* ==============================================
     * 10. COMMANDE HISTORY RELATIONS
     * ============================================== */
    Commande.hasMany(CommandeHistorique, {
      foreignKey: 'commande_id',
      as: 'historique',
      onDelete: 'CASCADE'
    });
  
    CommandeHistorique.belongsTo(Commande, {
      foreignKey: 'commande_id',
      as: 'commande',
      onDelete: 'CASCADE'
    });

    /* ==============================================
     * 11. CLIENT-UTILISATEUR RELATIONS
     * ============================================== */
    Utilisateur.hasOne(Client, {
      foreignKey: 'utilisateur_id',
      as: 'client',
      onDelete: 'CASCADE'
    });

    Client.belongsTo(Utilisateur, {
      foreignKey: 'utilisateur_id',
      as: 'utilisateur',
      onDelete: 'CASCADE'
    });

    /* ==============================================
     * 12. IMAGE RELATIONS
     * ============================================== */
    ImageArticleCouleur.belongsTo(Article, {
      foreignKey: 'article_id',
      as: 'article'
    });

    ImageArticleCouleur.belongsTo(Couleur, {
      foreignKey: 'couleur_id',
      as: 'couleur'
    });

    Article.hasMany(ImageArticleCouleur, {
      foreignKey: 'article_id',
      as: 'images_couleurs',
      onDelete: 'CASCADE'
    });

    Couleur.hasMany(ImageArticleCouleur, {
      foreignKey: 'couleur_id',
      as: 'article_images',
      onDelete: 'CASCADE'
    });

    /* ==============================================
     * 13. AJUSTEMENT STOCK RELATIONS
     * ============================================== */
    AjustementStock.belongsTo(Article, {
      foreignKey: 'article_id',
      as: 'article',
      onDelete: 'CASCADE'
    });

    AjustementStock.belongsTo(Taille, {
      foreignKey: 'taille_id',
      as: 'taille',
      onDelete: 'CASCADE'
    });

    AjustementStock.belongsTo(Utilisateur, {
      foreignKey: 'admin_id',
      as: 'admin',
      onDelete: 'CASCADE'
    });

    Article.hasMany(AjustementStock, {
      foreignKey: 'article_id',
      as: 'ajustements',
      onDelete: 'CASCADE'
    });

    Taille.hasMany(AjustementStock, {
      foreignKey: 'taille_id',
      as: 'ajustements',
      onDelete: 'CASCADE'
    });

    Utilisateur.hasMany(AjustementStock, {
      foreignKey: 'admin_id',
      as: 'ajustements',
      onDelete: 'CASCADE'
    });

    /* ==============================================
     * 14. REMISE ↔ ÉVÉNEMENT
     * ============================================== */
    Evenement.hasMany(Remise, {
      foreignKey: 'evenement_id',
      as: 'remises',
      onDelete: 'SET NULL'
    });

    Remise.belongsTo(Evenement, {
      foreignKey: 'evenement_id',
      as: 'evenement',
      onDelete: 'SET NULL'
    });

    /* ==============================================
     * 15. UTILISATEUR & HISTORIQUE
     * ============================================== */
    Utilisateur.belongsTo(Utilisateur, {
      foreignKey: 'created_by',
      as: 'creator'
    });

    HistoriqueAction.belongsTo(Utilisateur, {
      foreignKey: 'admin_id',
      as: 'admin'
    });
  
    HistoriqueAction.belongsTo(Utilisateur, {
      foreignKey: 'target_id',
      as: 'target'
    });

    CommandeHistorique.belongsTo(Utilisateur, {
      foreignKey: 'utilisateur_id',
      as: 'utilisateur'
    });

    Utilisateur.hasMany(CommandeHistorique, {
      foreignKey: 'utilisateur_id',
      as: 'modifications_commandes'
    });

    /* ==============================================
     * 16. ADDRESS RELATIONS
     * ============================================== */
    Adresse.belongsTo(Client, {
      foreignKey: 'client_id',
      as: 'client',
      onDelete: 'CASCADE'
    });

    Client.hasMany(Adresse, {
      foreignKey: 'client_id',
      as: 'adresses',
      onDelete: 'CASCADE'
    });

    Commande.belongsTo(Adresse, {
      foreignKey: 'adresse_id',
      as: 'adresse',
      onDelete: 'RESTRICT'
    });

    Adresse.hasMany(Commande, {
      foreignKey: 'adresse_id',
      as: 'commandes',
      onDelete: 'SET NULL'
    });

    /* ==============================================
     * 17. LIVREUR RELATIONS
     * ============================================== */
    Livreur.belongsTo(Utilisateur, {
      foreignKey: 'utilisateur_id',
      as: 'utilisateur',
      onDelete: 'CASCADE'
    });

    Utilisateur.hasOne(Livreur, {
      foreignKey: 'utilisateur_id',
      as: 'livreur',
      onDelete: 'CASCADE'
    });

    Livreur.hasMany(LivreurLocalisation, {
      foreignKey: 'livreur_id',
      as: 'localisations',
      onDelete: 'CASCADE'
    });

    LivreurLocalisation.belongsTo(Livreur, {
      foreignKey: 'livreur_id',
      as: 'livreur'
    });

    LivreurLocalisation.belongsTo(Commande, {
      foreignKey: 'commande_id',
      as: 'commande'
    });

    Commande.hasMany(LivreurLocalisation, {
      foreignKey: 'commande_id',
      as: 'livraison_tracking'
    });

    /* ==============================================
     * 18. FACTURE RELATIONS
     * ============================================== */
    Facture.belongsTo(Commande, {
      foreignKey: 'commande_id',
      as: 'commande',
      onDelete: 'CASCADE'
    });

    Commande.hasOne(Facture, {
      foreignKey: 'commande_id',
      as: 'facture',
      onDelete: 'CASCADE'
    });

      // Command -> Packages (1:N)
      Commande.hasMany(Colis, {
        foreignKey: 'commande_id',
        as: 'colis',
        onDelete: 'CASCADE',
        hooks: true // Ensure hooks run on cascade
      });

      Colis.belongsTo(Commande, { // Fixed typo: 'Commande' was misspelled
        foreignKey: 'commande_id',
        as: 'commande',
        onDelete: 'CASCADE'
      });

      // Command -> Returns (1:N)
      Commande.hasMany(Retour, {
        foreignKey: 'commande_id',
        as: 'retours',
        onDelete: 'CASCADE'
      });

      Retour.belongsTo(Commande, {
        foreignKey: 'commande_id',
        as: 'commande',
        onDelete: 'CASCADE'
      });

      // Deliveryman -> Packages (1:N)
      Livreur.hasMany(Colis, {
        foreignKey: 'livreur_id',
        as: 'colis', // Changed from 'colis_livres' for consistency
        onDelete: 'SET NULL'
      });

      Colis.belongsTo(Livreur, {
        foreignKey: 'livreur_id',
        as: 'livreur',
        onDelete: 'SET NULL'
      });

      // User -> Processed Returns (1:N)
      Utilisateur.hasMany(Retour, {
        foreignKey: 'traite_par',
        as: 'retours_traites',
        onDelete: 'SET NULL'
      });

      Retour.belongsTo(Utilisateur, {
        foreignKey: 'traite_par',
        as: 'traite_par_admin', // More explicit naming
        onDelete: 'SET NULL'
      });

      // Additional recommended relations:
      Colis.hasOne(Retour, { // Each package can have one return
        foreignKey: 'colis_id',
        as: 'retour',
        onDelete: 'SET NULL'
      });

      Retour.belongsTo(Colis, {
        foreignKey: 'colis_id',
        as: 'colis',
        onDelete: 'SET NULL'
      });
/**Liste denvie */
// In your relations setup file
ListeEnvies.belongsTo(Utilisateur, {
  foreignKey: 'utilisateur_id',
  as: 'utilisateur',
  onDelete: 'CASCADE'
});

ListeEnvies.belongsTo(Article, {
  foreignKey: 'article_id',
  as: 'article',
  onDelete: 'CASCADE'
});

Utilisateur.hasMany(ListeEnvies, {
  foreignKey: 'utilisateur_id',
  as: 'liste_envies',
  onDelete: 'CASCADE'
});

Article.hasMany(ListeEnvies, {
  foreignKey: 'article_id',
  as: 'dans_liste_envies',
  onDelete: 'CASCADE'
});

    console.log('✅ All model associations set up successfully');
  } catch (error) {
    console.error('❌ Error setting up model relations:', error);
    throw error;
  }
};