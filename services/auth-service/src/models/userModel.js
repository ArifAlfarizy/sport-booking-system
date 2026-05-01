import db from "../config/db.js";

export const findByEmail = async (email) => {
  const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
  return rows[0];
};

export const findById = async (id) => {
  const [rows] = await db.query("SELECT * FROM users WHERE id = ?", [id]);
  return rows[0];
};

export const createUser = async ({
  name,
  email,
  password,
  photo,
  oauth_provider,
  oauth_id,
  role,
}) => {
  const [result] = await db.query(
    `INSERT INTO users (name, email, password, photo, oauth_provider, oauth_id, role)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [name, email, password, photo, oauth_provider, oauth_id, role],
  );

  const [rows] = await db.query(
    `SELECT id, name, email, role FROM users WHERE id = ?`,
    [result.insertId],
  );

  return rows[0];
};

export const getUserOauth = async (oauth_id) => {
  const [rows] = await db.query(
    `SELECT * FROM users WHERE oauth_provider = 'google' AND oauth_id = ?`,
    [oauth_id],
  );
  return rows[0];
};

export const updateUser = async (id, data) => {
  const fields = [];
  const values = [];

  for (const key in data) {
    fields.push(`${key} = ?`);
    values.push(data[key]);
  }

  if (fields.length === 0) {
    throw new Error("No data to update");
  }

  values.push(id);

  await db.query(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`, values);

  const [rows] = await db.query(
    `SELECT id, name, email, role FROM users WHERE id = ?`,
    [id],
  );

  return rows[0];
};

export const deleteUser = async (id) => {
  const [result] = await db.query("DELETE FROM users WHERE id = ?", [id]);

  return result.affectedRows > 0;
};

export const softDeleteUser = async (id) => {
  await db.query("UPDATE users SET deleted_at = NOW() WHERE id = ?", [id]);
};
