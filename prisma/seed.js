const { PrismaClient } = require("@prisma/client");
const fs = require("node:fs");
const path = require("node:path");

const prisma = new PrismaClient();

async function main() {
  const filePath = path.join(__dirname, "../data/sample-tickets.json");
  const tickets = JSON.parse(fs.readFileSync(filePath, "utf8"));

  if (!Array.isArray(tickets) || tickets.length !== 50) {
    throw new Error("Expected exactly 50 tickets in the JSON file.");
  }

  for (const ticket of tickets) {
    if (
      !Number.isInteger(Number(ticket.id)) ||
      typeof ticket.title !== "string" ||
      typeof ticket.status !== "string"
    ) {
      throw new Error("Invalid ticket data found in JSON.");
    }
  }

  const result = await prisma.ticket.createMany({
    data: tickets.map((ticket) => ({
      id: Number(ticket.id),
      title: ticket.title,
      status: ticket.status,
    })),
    skipDuplicates: true,
  });

  await prisma.$queryRaw`
    SELECT setval(
      pg_get_serial_sequence('"Ticket"', 'id'),
      COALESCE((SELECT MAX(id) FROM "Ticket"), 1),
      true
    )
  `;

  const total = await prisma.ticket.count();

  console.log(`New tickets inserted: ${result.count}`);
  console.log(`Total tickets in database: ${total}`);
}

main()
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });