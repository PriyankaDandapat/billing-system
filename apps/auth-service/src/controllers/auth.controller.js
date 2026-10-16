const authService = require("../services/auth.service");
const {
  generateAccessToken,
  generateRefreshToken,
  REFRESH_TOKEN_TTL_MS,
} = require("../utils/token");
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
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
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

    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token is required" });
    }

    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken, userId: req.user.id },
    });

    res.json({ message: "Logged out successfully" });
  } catch (err) {
    next(err);
  }
};

exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token is required" });
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch {
      const err = new Error("Invalid or expired refresh token");
      err.statusCode = 401;
      throw err;
    }

    const stored = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (
      !stored ||
      stored.userId !== decoded.id ||
      stored.expiresAt <= new Date()
    ) {
      const err = new Error("Invalid or expired refresh token");
      err.statusCode = 401;
      throw err;
    }

    const user = { id: decoded.id };
    const accessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);
    const now = new Date();

    // Rotate the refresh token atomically so a token can only be used once.
    await prisma.$transaction(async (tx) => {
      const revoked = await tx.refreshToken.deleteMany({
        where: {
          token: refreshToken,
          userId: decoded.id,
          expiresAt: { gt: now },
        },
      });

      if (revoked.count !== 1) {
        const err = new Error("Invalid or expired refresh token");
        err.statusCode = 401;
        throw err;
      }

      await tx.refreshToken.create({
        data: {
          token: newRefreshToken,
          userId: decoded.id,
          expiresAt: new Date(now.getTime() + REFRESH_TOKEN_TTL_MS),
        },
      });
    });

    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (err) {
    next(err);
  }
};
