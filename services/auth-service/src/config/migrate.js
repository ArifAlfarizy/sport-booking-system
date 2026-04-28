import mysql from "mysql2/promise";
import "dotenv/config";

async function migrate() {
  let connection;

  try {
    // Koneksi database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });

    console.log(`Connected!`);

    // Buat database
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`,
    );
    console.log("Database ready");

    // Pakai database
    await connection.query(`USE ${process.env.DB_NAME}`);

    // Buat tabel users
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NULL,
        photo VARCHAR(255) NULL,
        oauth_provider ENUM('google','github') NULL,
        oauth_id VARCHAR(255) NULL,
        role ENUM('user','owner') NOT NULL DEFAULT 'user',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log(`Users tabel ready`);

    // Buat tabel refresh tokens
    await connection.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token TEXT NOT NULL,
        expired_at DATETIME NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    console.log("refresh_tokens table ready");

    // Buat tabel blacklist
    await connection.query(`
      CREATE TABLE IF NOT EXISTS token_blacklist (
        id INT AUTO_INCREMENT PRIMARY KEY,
        token TEXT NOT NULL,
        expired_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    console.log("token_blacklist table ready");

    console.log(`Migrate berhasil!`);
  } catch (err) {
    console.err("Migrate gagal. ", err);
  }
}

migrate();