// prisma/seed.ts
import prisma from "../src/lib/prisma"

async function main() {
  await prisma.user.update({
    where: { email: "admin@site.com" },
    data: { role: "ADMIN" },
  })
}

main()
