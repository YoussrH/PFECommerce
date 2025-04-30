const express = require("express");
const router = express.Router();
const { 
  verifierAdmin, 
  verifierSuperAdmin 
} = require("../middleware/authMiddleware");
const { 
  creerAdmin, 
  creerSuperAdmin, 
  supprimerAdmin,
  listerPersonnel,
  getActionHistory
} = require("../controllers/adminController");

router.use(verifierAdmin);

router.post("/creer-admin", verifierSuperAdmin, creerAdmin);
router.post("/creer-super-admin", verifierSuperAdmin, creerSuperAdmin);
router.delete("/supprimer-admin/:id", verifierSuperAdmin, supprimerAdmin);
router.get("/personnel", listerPersonnel);
router.get("/history/:adminId?", getActionHistory);

module.exports = router;