// Hashes passwords before storage and compares submitted passwords with stored hashes.
const bcrypt = require("bcrypt");

exports.hashPassword = (password) => {
  return bcrypt.hash(password, 10);
};

exports.comparePassword = (password, hash) => {
  return bcrypt.compare(password, hash);
};
