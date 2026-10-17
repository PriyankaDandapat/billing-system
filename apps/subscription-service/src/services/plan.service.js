const {prisma} = require("../config/db");

exports.listActivePlans = () =>
  prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
  });
