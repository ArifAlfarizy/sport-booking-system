import db from "../config/db.js";

// GET : User by email
export const findByEmail = async (email) => {
  const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
  return rows[0];
};

// CREATE: User
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

// GET: User by oauth
export const getUserOauth = async (oauth_id) => {
  const [rows] = await db.query(
    `SELECT * FROM users WHERE oauth_provider = 'google' AND oauth_id = ?;`,
    [oauth_id],
  );
  return rows[0];
};
