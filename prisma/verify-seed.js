const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Total tickets:", await prisma.ticket.count());

  console.log("First 5 tickets:");
  console.log(
    await prisma.ticket.findMany({
      orderBy: { id: "asc" },
      take: 5
    })
  );

  console.log("Last 5 tickets:");
  console.log(
    await prisma.ticket.findMany({
      orderBy: { id: "desc" },
      take: 5
    })
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());