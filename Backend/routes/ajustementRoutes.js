// routes/ajustementStockRoutes.js

const express = require("express");
const routeur = express.Router();
const { authentifier, verifierAdmin } = require("../middleware/authMiddleware");
const { 
    ajusterStock,
    obtenirHistoriqueAjustements,
    ajusterStockMultiple
  } = require("../controllers/ajustementController");
  
routeur.post("/ajuster",authentifier,verifierAdmin,ajusterStock);

routeur.get("/historique", authentifier, verifierAdmin, obtenirHistoriqueAjustements);
routeur.post("/multiple", authentifier, verifierAdmin, ajusterStockMultiple);
module.exports = routeur;