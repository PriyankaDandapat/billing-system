const { prisma } = require("../config/db");
const { hashPassword, comparePassword } = require("../utils/hash");

exports.signup = async (email, password, firstname, lastname, dob) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error("User already exists");

  const hashed = await hashPassword(password);

  const dobData = dob ? new Date(dob) : null;

  const user = await prisma.user.create({
    data: {
      email,
      password: hashed,
      firstname,
      lastname,
      ...(dobData && { dob: dobData }),
    },
  });

  const { password: _, ...safeUser } = user;
  return safeUser;
};

exports.login = async (email, password) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("Invalid credentials");

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) throw new Error("Invalid credentials");

  const { password: _, ...safeUser } = user;
  return safeUser;
};
