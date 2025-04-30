// src/routes/categoriesRoutes.js
const express = require("express");
const router = express.Router();
const categorieController = require("../controllers/categorieController");
const { authentifier, verifierAdmin } = require("../middleware/authMiddleware");
router.post("/ajouterCategorie", authentifier, verifierAdmin, categorieController.ajouterCategorie);
router.get("/", categorieController.obtenirToutesCategories);
router.get("/obtenirCategorieParId/:id", categorieController.obtenirCategorieParId);
router.put("/mettreAJourCategorie/:id", authentifier, verifierAdmin, categorieController.mettreAJourCategorie);
router.delete("/supprimerCategorie/:id", authentifier, verifierAdmin, categorieController.supprimerCategorie);
router.get("/hierarchie", categorieController.obtenirCategoriesHierarchiques);
module.exports = router;