import db from "../config/db.js";

export const saveRefreshToken = async (userId, token, expiredAt) => {
  return db.query(
    "INSERT INTO refresh_tokens (user_id, token, expired_at) VALUES (?, ?, ?)",
    [userId, token, expiredAt],
  );
};

export const findRefreshToken = async (token) => {
  const [rows] = await db.query(
    "SELECT * FROM refresh_tokens WHERE token = ?",
    [token],
  );
  return rows[0];
};

export const deleteRefreshToken = async (token) => {
  return db.query("DELETE FROM refresh_tokens WHERE token = ?", [token]);
};
