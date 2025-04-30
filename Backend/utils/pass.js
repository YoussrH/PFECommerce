const bcrypt = require("bcryptjs");

const plainPassword = "Yosr123";
bcrypt.hash(plainPassword, 10).then((hashedPassword) => {
  console.log("Hashed Password:", hashedPassword);
});
