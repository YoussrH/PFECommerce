require("dotenv").config();
const express = require("express");
const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);
const { Pool } = require("pg");
const cors = require("cors");

const app = express();
const articleRoutes = require("./routes/articleRoutes");
const categorieRoutes = require("./routes/categorieRoutes");
const marqueRoutes = require("./routes/marqueRoutes");
const genreRoutes = require("./routes/genreRoutes");
const tailleRoutes = require("./routes/tailleRoutes");
const couleursRouter = require("./routes/couleurRoutes");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const motpassRoutes = require("./routes/motpassRoutes");
const utilisateurRoutes = require("./routes/utilisateurRoutes");
const panierRoutes = require("./routes/panierRoutes");
const remiseRoutes = require("./routes/remiseRoutes");
const caisseRoutes = require("./routes/caisseRoutes");
const ajustementRoutes = require("./routes/ajustementRoutes");
const evenementRoutes = require('./routes/evenementRoutes');
const reclamationRoutes = require('./routes/reclamationRoutes');
const commandeRoutes = require('./routes/commandeRoutes');
const livraisonsRoutes = require('./routes/livraisonsRoutes');
const expeditionsRoutes = require('./routes/expeditionRoutes');
const livreurRoutes = require('./routes/livreurRoutes');
const path = require('path');
const cronJobs = require('./utils/cronJobs'); 
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT, 10)|| 2103, 
});

app.use(
  session({
    store: new pgSession({
      pool: pool,
      tableName: "session",
      createTableIfMissing: false,
      pruneSessionInterval: 60 * 60 
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge:  24 * 60 * 60 * 1000,
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? 'none' : 'lax',
    },
    name: 'mgm_session_id' 
  })
);


const corsOptions = {
  origin: ['http://localhost:3000'],
  credentials: true,
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'X-Guest-Token',  // Make sure this matches the header you're sending
    'guest-token'     // Alternative header name if needed
  ],
  exposedHeaders: ['set-cookie'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Add OPTIONS handler for preflight requests
app.options('*', cors());
app.use(express.urlencoded({ extended: true }));

app.use(express.json({ encoding: 'utf8' }));
app.options("*", cors());

app.use("/articles", articleRoutes);
app.use("/categories", categorieRoutes);
app.use("/marques", marqueRoutes);
app.use("/genres", genreRoutes);
app.use("/tailles", tailleRoutes);
app.use("/couleurs", couleursRouter);
app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/mot-de-passe", motpassRoutes);
app.use("/panier", panierRoutes);
app.use("/remises", remiseRoutes);
app.use("/caisse", caisseRoutes);
app.use("/ajustements", ajustementRoutes);
app.use("/evenements", evenementRoutes);
app.use('/reclamations', reclamationRoutes);
app.use("/commandes", commandeRoutes);
app.use("/livraisons", livraisonsRoutes);
app.use("/utilisateurs", utilisateurRoutes);
app.use("/expeditions", expeditionsRoutes);
app.use("/livreur", livreurRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});


const PORT = process.env.PORT || 5000;
const sequelize = require("./config/db");

sequelize.sync({ alter: true })
  .then(() => {
    app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("❌ Error syncing database:", err);
    process.exit(1);
  });