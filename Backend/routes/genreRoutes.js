// src/routes/genreRoutes.js
const express = require("express");
const router = express.Router();
const genreController = require("../controllers/genreController");
const { authentifier, verifierAdmin } = require("../middleware/authMiddleware");
router.get("/", genreController.obtenirTousGenres);
router.post("/ajouterGenre", authentifier, verifierAdmin, genreController.ajouterGenre);
router.put("/mettreAJourGenre/:id", authentifier, verifierAdmin, genreController.mettreAJourGenre);
router.delete("/supprimerGenre/:id", authentifier, verifierAdmin, genreController.supprimerGenre);

module.exports = router;