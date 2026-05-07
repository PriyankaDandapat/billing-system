const authService = require("../services/auth.service");
const { generateAccessToken, generateRefreshToken } = require("../utils/token");
const { prisma } = require("../config/db");
const jwt = require("jsonwebtoken");

exports.signup = async (req, res, next) => {
  try {
    const { email, password, firstname, lastname, dob } = req.body;

    const user = await authService.signup(
      email,
      password,
      firstname,
      lastname,
      dob,
    );

    res.status(201).json({ user });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const user = await authService.login(req.body.email, req.body.password);

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.json({ accessToken, refreshToken });
  } catch (err) {
    next(err);
  }
};

exports.logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });

    res.json({ message: "Logged out successfully" });
  } catch (err) {
    next(err);
  }
};

exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    const stored = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!stored) {
      const err = new Error("Invalid refresh token");
      err.statusCode = 401;
      throw err;
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const accessToken = generateAccessToken({ id: decoded.id });

    res.json({ accessToken });
  } catch (err) {
    next(err);
  }
};
