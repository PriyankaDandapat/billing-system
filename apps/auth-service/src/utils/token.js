const jwt = require("jsonwebtoken");

const REFRESH_TOKEN_TTL_MS = 5 * 24 * 60 * 60 * 1000;

exports.generateAccessToken = (user) => {
  return jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });
};

exports.generateRefreshToken = (user) => {
  return jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "5d",
  });
};

exports.REFRESH_TOKEN_TTL_MS = REFRESH_TOKEN_TTL_MS;
