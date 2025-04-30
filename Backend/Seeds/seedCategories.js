const sequelize = require("../config/db");
const Category = require("../models/Category");

const seedCategories = async () => {
  await sequelize.sync({ force: true }); // WARNING: Deletes all data before inserting

  const categories = [
    { name: "Chaussures", subcategories: ["Sandales et claquettes", "Baskets"] },
    { name: "Accessoires", subcategories: [
        "Sacs, sacs à dos, cartables", "Casquettes, chapeaux, bobs", "Foulards, écharpes et snoods",
        "Sous-vêtements et pyjamas", "Ceintures", "Chaussettes, collants"
    ] },
    { name: "Vêtements", subcategories: [
        "Tops et T-shirts", "Chemises et blouses", "Robes", "Pulls, sweats et gilets",
        "Vestes et blousons", "Jupes", "Shorts", "Pantalons et leggings",
        "Ensembles et combinaisons", "Maillots de bain"
    ] }
  ];

  for (const category of categories) {
    const parentCategory = await Category.create({ name: category.name, parentId: null });
    for (const sub of category.subcategories) {
      await Category.create({ name: sub, parentId: parentCategory.id });
    }
  }

  console.log("✅ Categories and subcategories added!");
  process.exit();
};

seedCategories();
