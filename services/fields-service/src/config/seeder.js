import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { randomUUID } from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, "../../.env") });

async function seed() {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    console.log("Connected to DB");

   
    await connection.query("SET FOREIGN_KEY_CHECKS = 0");
    await connection.query("TRUNCATE TABLE slots");
    await connection.query("TRUNCATE TABLE fields");
    await connection.query("SET FOREIGN_KEY_CHECKS = 1");

    console.log("Old data cleared");

    
    const ownerId = "11111111-1111-1111-1111-111111111111";

  
    const fields = [
      {
        id: randomUUID(),
        name: "Futsal Arena Bandung",
        type: "futsal",
        address: "Jl. Asia Afrika No.1",
        city: "Bandung",
      },
      {
        id: randomUUID(),
        name: "Basket Hall Jakarta",
        type: "basketball",
        address: "Jl. Sudirman No.10",
        city: "Jakarta",
      },
    ];

    for (const f of fields) {
      await connection.query(
        `INSERT INTO fields (id, owner_id, name, type, address, city)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [f.id, ownerId, f.name, f.type, f.address, f.city]
      );
    }

    console.log("Fields seeded");

  
    const slots = [];

    for (const f of fields) {
      const baseSlots = [
        ["monday", "08:00:00", "10:00:00", 100000],
        ["monday", "10:00:00", "12:00:00", 120000],
        ["tuesday", "13:00:00", "15:00:00", 110000],
      ];

      for (const s of baseSlots) {
        slots.push({
          id: randomUUID(),
          field_id: f.id,
          day: s[0],
          start_time: s[1],
          end_time: s[2],
          price: s[3],
        });
      }
    }

    for (const s of slots) {
      await connection.query(
        `INSERT INTO slots (id, field_id, day, start_time, end_time, price)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [s.id, s.field_id, s.day, s.start_time, s.end_time, s.price]
      );
    }

    console.log("Slots seeded");
    console.log("Seeder SUCCESS (NO DUPLICATE DATA)");
  } catch (err) {
    console.error("Seeder gagal:", err);
  } finally {
    if (connection) await connection.end();
  }
}

seed();