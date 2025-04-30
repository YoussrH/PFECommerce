const crypto = require("crypto");

// Generate a 32-byte (256-bit) random string
const secret = crypto.randomBytes(32).toString("base64");

console.log("JWT_SECRET:", secret);