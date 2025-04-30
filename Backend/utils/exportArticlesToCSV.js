const path = require('path');
const fs = require('fs');
const { Parser } = require('json2csv');
const { Sequelize } = require('sequelize');

// 1. Load environment variables with absolute path
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// 2. Create a new Sequelize instance with explicit configuration
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false, // Disable logging to avoid deprecation warning
    dialectOptions: {
      // Critical for handling SCRAM authentication
      ssl: false,
      authentication: {
        type: 'md5', // Force MD5 authentication instead of SCRAM
        options: {
          username: process.env.DB_USER,
          password: process.env.DB_PASSWORD
        }
      }
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// 3. Verify database connection with custom authentication
async function testConnection() {
  try {
    console.log('Testing database connection with these parameters:', {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD ? '*****' : 'MISSING'
    });

    await sequelize.authenticate();
    console.log('✅ Database connection successful!');
    return true;
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    
    // Detailed troubleshooting guide
    console.log('\n=== PostgreSQL Connection Troubleshooting ===');
    console.log('1. Verify PostgreSQL service is running on port 2103');
    console.log('2. Check user credentials:');
    console.log(`   psql -h ${process.env.DB_HOST} -p ${process.env.DB_PORT} -U ${process.env.DB_USER} -d ${process.env.DB_NAME}`);
    console.log('3. If authentication fails, try:');
    console.log('   a. Reset password: ALTER USER Yosr WITH PASSWORD \'Yosr123\';');
    console.log('   b. Change authentication method in pg_hba.conf:');
    console.log('      host all all 127.0.0.1/32 md5');
    console.log('4. Restart PostgreSQL after changes: sudo service postgresql restart');
    
    return false;
  }
}


async function exportArticles() {
  try {
    const connectionSuccess = await testConnection();
    if (!connectionSuccess) throw new Error('Database connection failed');

    const db = require('../models');
    db.sequelize = sequelize;

    console.log('Fetching articles with proper size data...');
    const articles = await db.Article.scope('avecQuantiteTotale').findAll({
      include: [
        { model: db.Categorie, as: 'categorie', attributes: ['libelle'] },
        { model: db.Marque, as: 'marque', attributes: ['libelle'] },
        { model: db.Genre, as: 'genre', attributes: ['libelle'] },
        { 
          model: db.Couleur, 
          as: 'couleurs', 
          through: { attributes: [] }, 
          attributes: ['libelle'] 
        },
        { 
          model: db.Taille, 
          as: 'tailles', 
          through: { 
            model: db.ArticleTaille,
            attributes: ['quantite']
          },
          attributes: ['libelle'] // Only include libelle since valeur doesn't exist
        },
      ],
      order: [['id', 'ASC']]
    });

    if (!articles?.length) {
      console.warn('⚠️ No articles found in database');
      return;
    }

    // Prepare dataset with proper size extraction
    const dataset = articles.map(article => {
      // Filter out sizes with quantity = 0 and map to their libelle
      const activeSizes = article.tailles
        .filter(t => t.ArticleTaille.quantite > 0)
        .map(t => t.libelle);
      
      return {
        id: article.id,
        nom_produit: article.nom_produit,
        description: article.description || '',
        prix: article.prix,
        prix_final: article.prix_final,
        sku: article.sku || '',
        categorie: article.categorie?.libelle || '',
        marque: article.marque?.libelle || '',
        genre: article.genre?.libelle || '',
        couleurs: article.couleurs.map(c => c.libelle).join(', '),
        tailles: activeSizes.join(','), // Join with commas
        quantite_totale: article.get('quantite_totale') || 0,
        created_at: article.created_at,
        updated_at: article.updated_at
      };
    });

    const parser = new Parser();
    const csv = parser.parse(dataset);
    
    const exportDir = path.join(__dirname, '../exports');
    if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir, { recursive: true });
    
    fs.writeFileSync(path.join(exportDir, 'articles_export.csv'), csv, 'utf-8');
    console.log('✅ CSV successfully saved with proper size data');
    
  } catch (error) {
    console.error('❌ Export failed:', error);
    process.exit(1);
  } finally {
    if (sequelize) await sequelize.close();
  }
}
// Add this function to exportArticles.js
async function exportSizeMappings() {
  try {
    const db = require('../models');
    const sizes = await db.Taille.findAll({
      attributes: ['id', 'libelle'], // Include both libelle and valeur if available
      raw: true
    });

    const sizeMappings = {};
    sizes.forEach(size => {
      // Use valeur if available, otherwise use libelle
      sizeMappings[size.id] = size.valeur || size.libelle;
    });

    const exportDir = path.join(__dirname, '../exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    fs.writeFileSync(
      path.join(exportDir, 'size_mappings.json'),
      JSON.stringify(sizeMappings, null, 2),
      'utf-8'
    );
    console.log('✅ Size mappings exported successfully');
  } catch (error) {
    console.error('❌ Failed to export size mappings:', error);
  }
}

// Then add this to your main execution:
(async () => {
  await exportArticles();
  await exportSizeMappings(); // Add this line
  console.log('Export completed successfully!');    
})();

