import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, "../../.env") });

async function migrate() {
  let connection;

  try {
    // Koneksi database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });

    console.log(`Connected`);

    // Buat database
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`,
    );
    console.log("Database ready");

    // Pakai database
    await connection.query(`USE ${process.env.DB_NAME}`);

    // Buat tabel lapangan
    await connection.query(`
     CREATE TABLE fields (
      id          CHAR(36)     NOT NULL DEFAULT (UUID()),
      owner_id    CHAR(36)     NOT NULL COMMENT 'References user_db.users.id',
      name        VARCHAR(150) NOT NULL,
      type        ENUM('futsal', 'basketball', 'badminton', 'tennis', 'volleyball', 'other') NOT NULL,
      address     TEXT         NOT NULL,
      city        VARCHAR(100) NOT NULL,
      status      ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
      created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
      PRIMARY KEY (id),
      KEY idx_owner (owner_id),
      KEY idx_city_type (city, type)
     ) ENGINE=InnoDB;
    `);

    console.log(`Field tabel telah dibuat`);

    // Buat tabel slots
    await connection.query(`
      CREATE TABLE slots (
        id          CHAR(36)       NOT NULL DEFAULT (UUID()),
        field_id    CHAR(36)       NOT NULL,
        day         ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday') NOT NULL,
        start_time  TIME           NOT NULL,
        end_time    TIME           NOT NULL,
        price       DECIMAL(12,2)  NOT NULL,
        dp_percent  TINYINT        NOT NULL DEFAULT 30 COMMENT 'Minimum down payment percentage',
        status      ENUM('available', 'booked', 'off') NOT NULL DEFAULT 'available',
        created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      
        PRIMARY KEY (id),
        KEY idx_field_day (field_id, day),
        CONSTRAINT fk_slot_field FOREIGN KEY (field_id) REFERENCES fields(id) ON DELETE CASCADE,
        CONSTRAINT chk_time CHECK (end_time > start_time)
      ) ENGINE=InnoDB;
    `);

    console.log(`Slots tabel telah dibuat`);

    console.log(`Migrate berhasil!`);
  } catch (err) {
    console.error("Migrate gagal. ", err);
  }  finally {
    if (connection) await connection.end(); 
  }

}

migrate()