import db from "../config/db.js";

// GET all slots by field + filter
export const findSlotsByField = async (field_id, day, status) => {
  let query = "SELECT * FROM slots WHERE field_id = ?";
  const values = [field_id];

  if (day) {
    query += " AND day = ?";
    values.push(day);
  }

  if (status) {
    query += " AND status = ?";
    values.push(status);
  }

  const [rows] = await db.query(query, values);
  return rows;
};

// GET slot by id
export const findSlotById = async (id) => {
  const [rows] = await db.query("SELECT * FROM slots WHERE id = ?", [id]);
  return rows[0];
};

// CREATE slot
export const createSlot = async (data) => {
  const { field_id, day, start_time, end_time, price, dp_percent } = data;

  const [result] = await db.query(
    `INSERT INTO slots (field_id, day, start_time, end_time, price, dp_percent, status)
     VALUES (?, ?, ?, ?, ?, ?, 'available')`,
    [field_id, day, start_time, end_time, price, dp_percent],
  );

  const [rows] = await db.query("SELECT * FROM slots WHERE id = ?", [
    result.insertId,
  ]);

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

  const [rows] = await db.query("SELECT * FROM slots WHERE id = ?", [id]);
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
