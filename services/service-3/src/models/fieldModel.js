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
export const createField = async ({
  owner_id,
  name,
  type,
  address,
  city,
  status,
}) => {
  const [result] = await db.query(
    "INSERT INTO fields (owner_id, name, type, address, city, status) VALUES (?, ?, ?, ?, ?, ?)",
    [owner_id, name, type, address, city, status],
  );
  const [rows] = await db.query(
    "SELECT * FROM fields WHERE owner_id = ? ORDER BY created_at DESC LIMIT 1",
    [owner_id],
  );

  return rows[0];
};

// PUT : Update a field
export const updateField = async (id, data) => {
  const fields = [];
  const values = [];

  for (const key in data) {
    fields.push(`${key} = ?`);
    values.push(data[key]);
  }

  if (fields.length === 0) {
    throw new Error("Tidak ada data yang diupdate");
  }

  await db.query(`UPDATE fields SET ${fields.join(", ")} WHERE id = ?`, [
    ...values,
    id,
  ]);

  const [rows] = await db.query(
    "SELECT id, owner_id, name, `type`, address, city, status FROM fields WHERE id = ?",
    [id],
  );

  return rows[0];
};

// DELETE
export const deleteField = async (id) => {
  const [result] = await db.query("DELETE FROM fields WHERE id = ?", [id]);

  return result;
};
