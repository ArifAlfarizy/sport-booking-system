import db from "../config/db.js";
import { v4 as uuidv4 } from "uuid";

const SLOT_SELECT = `
  SELECT 
    slots.id,
    slots.field_id,
    fields.name AS field_name,
    fields.city AS field_city,
    fields.type AS field_type,
    slots.day,
    slots.start_time,
    slots.end_time,
    slots.price,
    slots.dp_percent,
    slots.status,
    slots.created_at
  FROM slots
  JOIN fields ON slots.field_id = fields.id
`;

// GET all slots
export const findAllSlots = async ({
  day,
  status,
  city,
  type,
  field_id,
  minPrice,
  maxPrice,
  page,
  limit,
}) => {
  const conditions = [];
  const values = [];

  if (field_id) {
    conditions.push("slots.field_id = ?");
    values.push(field_id);
  }
  if (day) {
    conditions.push("slots.day = ?");
    values.push(day);
  }
  if (status) {
    conditions.push("slots.status = ?");
    values.push(status);
  }
  if (city) {
    conditions.push("fields.city = ?");
    values.push(city);
  }
  if (type) {
    conditions.push("fields.type = ?");
    values.push(type);
  }
  if (minPrice) {
    conditions.push("slots.price >= ?");
    values.push(Number(minPrice));
  }
  if (maxPrice) {
    conditions.push("slots.price <= ?");
    values.push(Number(maxPrice));
  }

  const where =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  // Hitung total data untuk meta pagination
  const [countRows] = await db.query(
    `SELECT COUNT(*) AS total FROM slots JOIN fields ON slots.field_id = fields.id ${where}`,
    values,
  );
  const total = countRows[0].total;

  // Query data dengan LIMIT dan OFFSET
  const offset = (page - 1) * limit;
  const [rows] = await db.query(
    `${SLOT_SELECT} ${where} ORDER BY slots.created_at DESC LIMIT ? OFFSET ?`,
    [...values, limit, offset],
  );

  return { rows, total };
};

// GET all slots by field + filter
export const findSlotsByField = async (field_id, day, status) => {
  let query = SLOT_SELECT + " WHERE slots.field_id = ?";
  const values = [field_id];

  if (day) {
    query += " AND slots.day = ?";
    values.push(day);
  }

  if (status) {
    query += " AND slots.status = ?";
    values.push(status);
  }

  const [rows] = await db.query(query, values);
  return rows;
};

// GET slot by id
export const findSlotById = async (id) => {
  const [rows] = await db.query(SLOT_SELECT + " WHERE slots.id = ?", [id]);
  return rows[0];
};

// CREATE slot
export const createSlot = async (data) => {
  const { field_id, day, start_time, end_time, price, dp_percent } = data;

  const id = uuidv4();

  await db.query(
    `INSERT INTO slots (id, field_id, day, start_time, end_time, price, dp_percent, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'available')`,
    [id, field_id, day, start_time, end_time, price, dp_percent],
  );

  const [rows] = await db.query(SLOT_SELECT + " WHERE slots.id = ?", [id]);

  return rows[0];
};

// UPDATE slot
export const updateSlot = async (id, data) => {
  const fields = [];
  const values = [];

  for (const key in data) {
    fields.push(`\`${key}\` = ?`);
    values.push(data[key]);
  }

  if (fields.length === 0) {
    throw new Error("Tidak ada data yang diupdate");
  }

  const [result] = await db.query(
    `UPDATE slots SET ${fields.join(", ")} WHERE id = ?`,
    [...values, id],
  );

  if (result.affectedRows === 0) {
    throw new Error("Slot tidak ditemukan");
  }

  const [rows] = await db.query(SLOT_SELECT + " WHERE slots.id = ?", [id]);
  return rows[0];
};

// DELETE slot (cek tidak booked)
export const deleteSlot = async (id) => {
  const [rows] = await db.query("SELECT * FROM slots WHERE id = ?", [id]);

  if (rows.length === 0) {
    throw new Error("Slot tidak ditemukan");
  }

  if (rows[0].status === "booked") {
    throw new Error("Slot sudah dibooking, tidak bisa dihapus");
  }

  await db.query("DELETE FROM slots WHERE id = ?", [id]);

  return rows[0];
};
