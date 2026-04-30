import jwt from "jsonwebtoken";
import "dotenv/config";
import db from "../config/db.js";

export const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: "15m" },
  );
};

export const generateRefreshToken = (user) => {
  return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });
};

export const saveRefreshToken = async (userId, token) => {
  const expiredAt = new Date();
  expiredAt.setDate(expiredAt.getDate() + 7); // 7 hari

  await db.query(
    "INSERT INTO refresh_tokens (user_id, token, expired_at) VALUES (?, ?, ?)",
    [userId, token, expiredAt],
  );
};

export const revokeRefreshToken = async (token) => {
  await db.query("DELETE FROM refresh_tokens WHERE token = ?", [token]);
};

export const blacklistToken = async (token) => {
  const decoded = jwt.decode(token);
  const expiredAt = decoded?.exp
    ? new Date(decoded.exp * 1000)
    : new Date(Date.now() + 15 * 60 * 1000);

  await db.query(
    "INSERT INTO token_blacklist (token, expired_at) VALUES (?, ?)",
    [token, expiredAt],
  );
};

export const isTokenBlacklisted = async (token) => {
  const [rows] = await db.query(
    "SELECT id FROM token_blacklist WHERE token = ?",
    [token],
  );
  return rows.length > 0;
};

