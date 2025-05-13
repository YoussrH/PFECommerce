const express = require("express");
const router = express.Router();
const multer = require('multer');
const articleController = require("../controllers/articleController");
const { authentifier, verifierAdmin } = require("../middleware/authMiddleware");

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
});

const upload = multer({ storage: storage });

router.put("/mettreAJourArticle/:id",authentifier,verifierAdmin,upload.array('images'),articleController.validateUpdateArticle,articleController.mettreAJourArticle);
router.get("/obtenirArticleParId/:id", articleController.obtenirArticleParId);
router.get("/obtenirArticleParSku/:sku", articleController.obtenirArticleParSku);

router.post("/ajouterArticle", authentifier, verifierAdmin, articleController.ajouterArticle);
router.get("/", articleController.obtenirTousArticles);
router.delete("/supprimerArticle/:id", authentifier, verifierAdmin, articleController.supprimerArticle);
router.get("/obtenirDerniersArticles", articleController.obtenirDerniersArticles);
router.post("/filtrerArticles", articleController.filtrerArticles);
router.post("/filtrerArticlesGFemme", articleController.filtrerArticlesGFemme);
router.post("/filtrerArticlesGHomme", articleController.filtrerArticlesGHomme);

router.get("/rechercherArticles", articleController.rechercherArticles);
router.get("/obtenirMarqueAleatoire/actuel", articleController.obtenirMarqueAleatoire);
router.get("/obtenirArticlesParGenre/:id", articleController.obtenirArticlesParGenre);
router.get('/count',  articleController.obtenirNombreArticles);
router.get("/obtenirArticlesPetitPrix", articleController.obtenirArticlesPetitPrix);
router.get("/obtenirArticlesFille", articleController.obtenirArticlesFille);
router.post("/ajouterArticles", authentifier, verifierAdmin, articleController.ajouterArticles);
router.get("/obtenirArticlesBebe", articleController.obtenirArticlesBebe);
router.get("/ObtenirTousArticleAleatoire", articleController.ObtenirTousArticleAleatoire);
router.get("/obtenirArticleQuotidien", articleController.obtenirArticleQuotidien);


// Get brand collections/categories
router.get('/petits-prix', articleController.obtenirArticlesPetitPrix);
router.get('/obtenirArticlesFemme', articleController.obtenirArticlesFemme);
router.get('/obtenirArticlesHomme', articleController.obtenirArticlesHomme);

module.exports = router;