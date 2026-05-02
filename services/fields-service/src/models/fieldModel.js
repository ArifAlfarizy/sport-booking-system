import db from "../config/db.js";

// GET : All fields
export const findAllFields = async (filters = {}) => {
  const conditions = [];
  const values = [];

  if (filters.city) {
    conditions.push("city = ?");
    values.push(filters.city);
  }
  if (filters.type) {
    conditions.push("type = ?");
    values.push(filters.type);
  }
  if (filters.status) {
    conditions.push("status = ?");
    values.push(filters.status);
  }
  if (filters.owner_id) {
    conditions.push("owner_id = ?");
    values.push(filters.owner_id);
  }
  if (filters.price?.gte !== undefined) {
    conditions.push("price >= ?");
    values.push(filters.price.gte);
  }
  if (filters.price?.lte !== undefined) {
    conditions.push("price <= ?");
    values.push(filters.price.lte);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const [rows] = await db.query(
    `SELECT * FROM fields ${where} ORDER BY created_at DESC`,
    values
  );
  return rows;
};

// GET : Field detail by id
export const findFieldById = async (id) => {
  const [rows] = await db.query(`SELECT * FROM fields WHERE id = ?`, [id]);
  return rows[0];
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
