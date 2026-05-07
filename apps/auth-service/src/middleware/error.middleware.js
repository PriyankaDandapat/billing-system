module.exports = (err, req, res, next) => {
  console.error(err); // replace later with logger

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    message: err.message || "Internal Server Error",
  });
};
