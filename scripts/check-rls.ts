import { config } from "dotenv";
config({ path: ".env.local" });
import { prisma } from "../src/lib/prisma";

async function main() {
  const rows = await prisma.$queryRawUnsafe<Array<{ tablename: string; rowsecurity: boolean }>>(
    `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename NOT LIKE '_prisma_%' ORDER BY tablename;`
  );
  console.table(rows);
}
main().finally(() => prisma.$disconnect());
