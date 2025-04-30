const express = require("express");
const routeur = express.Router();
const couleurController = require("../controllers/couleurController");
const upload = require("../Middleware/uploadMiddleware");

routeur.post("/extract-from-image",  upload.single('image'),  couleurController.extractFromImage);
routeur.get("/", couleurController.obtenirToutesCouleurs);
routeur.post("/suggest/text", couleurController.suggestColorsFromText);
routeur.post("/ajouterCouleur", couleurController.ajouterCouleur);
module.exports = routeur;
