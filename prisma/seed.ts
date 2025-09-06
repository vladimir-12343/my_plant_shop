import prisma from "../src/lib/prisma.js";
import bcrypt from "bcrypt";

async function main() {
  if (!process.env["ADMIN_PASSWORD"]) {
    throw new Error("❌ ADMIN_PASSWORD не задан в .env");
  }

  const password = await bcrypt.hash(process.env["ADMIN_PASSWORD"], 10);

  await prisma.user.upsert({
    where: { email: "admin@site.com" },
    update: { role: "ADMIN" },
    create: {
      email: "admin@site.com",
      password,
      role: "ADMIN",
    },
  });
}

main()
  .then(() => {
    console.log("✅ Admin user seeded");
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
