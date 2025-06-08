require("dotenv").config();
const express = require("express");
const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);
const { Pool } = require("pg");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");

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
const listeEnviesRoutes = require('./routes/listeEnviesRoutes');
const clientRoutes = require('./routes/clientRoutes');
const paimentRoutes = require('./routes/paimentRoutes');
const factureRoutes = require('./routes/factureRoutes');
const path = require('path');
const cronJobs = require('./utils/cronJobs'); 
const avisRoutes = require('./routes/avisRoutes');
const couponRoutes = require('./routes/couponRoutes');
const chatRoutes = require('./routes/chatRoutes');
const catalogRoutes = require('./routes/catalogue');
// Create HTTP server for Socket.IO
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ['http://localhost:3000', 'your-app-url-here'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  // Handle livreur subscription
  socket.on('subscribe-livreur', (livreurId) => {
    socket.join(`livreur-${livreurId}`);
    console.log(`Livreur ${livreurId} subscribed to notifications`);
  });

    // Add admin subscription handler
  socket.on('subscribe-admin', () => {
    socket.join('admin-room');
    console.log('Admin subscribed to notifications');
    
    // Optional: Send any pending notifications when admin first connects
    // You would need to implement this based on your application needs
  });

  // Handle reclamation notifications
  socket.on('subscribe-reclamations', () => {
    socket.join('reclamations-room');
    console.log(`Client ${socket.id} subscribed to reclamation updates`);
  });
  

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Make io available in routes
app.set('io', io);

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT, 10)|| 2103, 
});

const corsOptions = {
  origin: ['http://localhost:3000', 'http://localhost:5000'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-guest-token','Set-Cookie', 'Cache-Control'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  exposedHeaders: ['set-cookie']
};

// Update session configuration
app.use(
  session({
    store: new pgSession({
      pool: pool,
      tableName: "session",
      createTableIfMissing: true, // Changed to true to ensure table exists
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      sameSite: 'lax', // Changed from 'none' to 'lax' for development
    },
    name: 'mgm_session_id'
  })
);

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
app.use("/liste-envies", listeEnviesRoutes);
app.use("/clients", clientRoutes);
app.use("/paiements", paimentRoutes);
app.use("/factures", factureRoutes); 
app.use("/avis", avisRoutes); 
app.use('/coupons', couponRoutes);
app.use('/chat', chatRoutes);

app.use('/catalog',catalogRoutes)

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

const PORT = process.env.PORT || 5000;
const sequelize = require("./config/db");

sequelize.sync({ alter: true })
  .then(() => {
    server.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("❌ Error syncing database:", err);
    process.exit(1);
  });