require("dotenv").config({path:"../.env"});
const { Sequelize, DataTypes } = require("sequelize");

// Debug: Check environment variables
console.log("DB_NAME:", process.env.DB_NAME);
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_PASSWORD:", process.env.DB_PASSWORD);
console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_PORT:", process.env.DB_PORT);

// Initialize Sequelize
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 2103, // Ensure port is a number
    dialect: "postgres",
    logging: console.log, // Enable logging for debugging
  }
);

// Define Marque model
const Marque = sequelize.define("Marque", {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
}, {
  tableName: "marques",
  timestamps: true, // Enable timestamps (createdAt and updatedAt)
  createdAt: "createdAt", // Map to the correct column name
  updatedAt: "updatedAt", // Map to the correct column name
});

// Insert marques
async function insertMarques() {
  try {
    await sequelize.authenticate();
    console.log("✅ Connected to the database.");

    const marques = [
      "TED CLARNE'S",
      "BOSS",
      "TLILA",
      "O'spella",
      "HUGO",
      "P'TIT FRIMEUR",
      "LANVIN",
      "CHLOÉ",
      "KENZO",
    ];

    for (const name of marques) {
      await Marque.findOrCreate({ where: { name } });
    }

    console.log("✅ Marques inserted successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error inserting marques:", error);
    process.exit(1);
  }
}

insertMarques();