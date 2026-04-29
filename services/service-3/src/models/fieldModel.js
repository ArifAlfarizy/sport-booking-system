import db from "../config/db.js";

// GET : All fields
export const findAllFields = async () => {
  const [rows] = await db.query(
    `SELECT * FROM fields ORDER BY created_at DESC`,
  );
  return rows;
};

// GET : Field detail by id
export const findFieldById = async (id) => {
  const [rows] = await db.query(`SELECT * FROM fields WHERE id = ?`, [id]);
  return [rows];
};

// POST: Create a fields
export const createField = async (
  owner_id,
  name,
  type,
  address,
  city,
  status,
) => {
  const [result] = await db.query(
    "INSERT INTO fields (owner_id, name, type, address, city, status) VALUES (?, ?, ?, ?, ?, ?)",
    [owner_id, name, type, address, city, status],
  );
  const [rows] = await db.query(
    `SELECT name, type, address, city, status FROM fields WHERE id = ?`,
    [result.insertId],
  );

  return rows[0];
};
