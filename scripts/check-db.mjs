import pg from "pg";

const { Client } = pg;

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is missing. Add it to .env.local.");
  process.exit(1);
}

const client = new Client({
  connectionString: databaseUrl,
});

try {
  await client.connect();

  const result = await client.query("SELECT current_database() AS db, current_user AS usr");
  const row = result.rows[0];

  console.log(`Connected to PostgreSQL database "${row.db}" as "${row.usr}".`);
  process.exit(0);
} catch (error) {
  console.error("Database connectivity check failed.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
} finally {
  await client.end().catch(() => {});
}
