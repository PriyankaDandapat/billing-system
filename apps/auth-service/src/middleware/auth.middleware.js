// Verifies the access token from the Authorization header and attaches its user claims to the request.
const jwt = require("jsonwebtoken");

exports.protect = (req, res, next) => {
  // const token = req.headers.authorization?.split(" ")[1];
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Bearer token required" });
  }
  const token = authHeader.slice("Bearer ".length);

  if (!token) return res.status(401).json({ message: "No token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};
