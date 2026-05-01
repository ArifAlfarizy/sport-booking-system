import { findByEmail, createUser, findById } from "../models/userModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import {
  saveRefreshToken,
  revokeRefreshToken,
  findRefreshToken,
} from "../utils/tokenHelper.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/tokenHelper.js";

const saltRounds = 10;

const isValidEmail = (email) => {
  return typeof email === "string" && email.includes("@");
};

export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if ((!name || !email || !password, !role)) {
      return res.status(400).json({
        success: false,
        message: "Field wajib diisi: name, email, password, role",
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Email tidak valid",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password minimal 6 karakter",
      });
    }

    const existingEmail = await findByEmail(email);
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: "Email sudah terdaftar",
      });
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = await createUser({
      name,
      email,
      password: hashedPassword,
      role: role || "user",
    });

    const accessToken = generateAccessToken(newUser);
    const refreshToken = generateRefreshToken(newUser);

    const expiredAt = new Date();
    expiredAt.setDate(expiredAt.getDate() + 7);

    await saveRefreshToken(newUser.id, refreshToken, expiredAt);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return res.status(201).json({
      success: true,
      message: "Berhasil register",
      data: newUser,
      accessToken,
    });
  } catch (error) {
    console.error("Register Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email dan password wajib diisi",
      });
    }

    const user = await findByEmail(email);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Email atau password salah",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Email atau password salah",
      });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    const expiredAt = new Date();
    expiredAt.setDate(expiredAt.getDate() + 7);

    await saveRefreshToken(user.id, refreshToken, expiredAt);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return res.status(200).json({
      success: true,
      message: "Berhasil login",
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      accessToken,
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
export const refresh = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token tidak ditemukan",
      });
    }

    const savedToken = await findRefreshToken(token);

    if (!savedToken) {
      return res.status(403).json({
        success: false,
        message: "Token tidak valid",
      });
    }

    jwt.verify(token, process.env.JWT_REFRESH_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(403).json({
          success: false,
          message: "Token tidak valid",
        });
      }


      const user = await findById(decoded.id)
  

      if (!user) {
        return res.status(403).json({
          success: false,
          message: "User tidak ditemukan",
        });
      }

      const newAccessToken = generateAccessToken(user);

      return res.status(200).json({
        success: true,
        accessToken: newAccessToken,
      });
    });
  } catch (error) {
    console.error("Refresh Error:", error);
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
      return res.status(400).json({
        success: false,
        message: "Token tidak ditemukan",
      });
    }

    await revokeRefreshToken(token);

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return res.status(200).json({
      success: true,
      message: "Berhasil logout",
    });
  } catch (error) {
    console.error("Logout Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
