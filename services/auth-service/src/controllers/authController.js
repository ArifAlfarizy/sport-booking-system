import { findByEmail, createUser } from "../models/userModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { saveRefreshToken, deleteRefreshToken } from "../models/tokenModel.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/tokenHelper.js";
const saltRounds = 10;

export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res
        .status(400)
        .json({ message: "Field wajib diisi: name, email, password, role" });
    }

    const existingEmail = await findByEmail(email);
    if (existingEmail) {
      return res
        .status(409)
        .json({ message: "Email sudah terdaftar. Silahkan login!" });
    }

    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await createUser({
      name,
      email,
      password: hashedPassword,
      role,
    });

    const accessToken = generateAccessToken(newUser);
    const refreshToken = generateRefreshToken(newUser);

    const expiredAt = new Date();
    expiredAt.setDate(expiredAt.getDate() + 7);
    await saveRefreshToken(newUser.id, refreshToken, expiredAt);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false, 
      sameSite: "lax", 
    });

    res.status(201).json({
      message: "Berhasil register user",
      data: newUser,
      token: accessToken,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Field wajib diisi: email dan password" });
    }

    const existingEmail = await findByEmail(email);

    if (!existingEmail) {
      return res
        .status(401)
        .json({ message: "Email belum terdaftar. Silahkan register!" });
    }

    // Destructure
    const { password: savedPassword } = existingEmail;

    // Check password
    const isPasswordValid = await bcrypt.compare(password, savedPassword);

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid password" });
    }

    // Refresh token
    const accessToken = generateAccessToken(existingEmail);
    const refreshToken = generateRefreshToken(existingEmail);

    const expiredAt = new Date();
    expiredAt.setDate(expiredAt.getDate() + 7);

    await saveRefreshToken(existingEmail.id, refreshToken, expiredAt);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });

    res.status(200).json({
      message: "Berhasil login user",
      data: {
        name: existingEmail.name,
        email: existingEmail.email,
      },
      accessToken: accessToken,
      refreshToken: refreshToken,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const refresh = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json({ error: "No token provided" });

    jwt.verify(token, process.env.JWT_REFRESH_SECRET, (err, user) => {
      if (err) return res.status(403).json({ error: "Invalid token" });

      const newAccessToken = generateAccessToken(user);

      res.status(200).json({ accessToken: newAccessToken });
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const logout = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;

    if (!token) {
      return res.status(400).json({ message: "Tidak ada token" });
    }

    await deleteRefreshToken(token);

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });

    res.status(200).json({ message: "Berhasil logout" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};
