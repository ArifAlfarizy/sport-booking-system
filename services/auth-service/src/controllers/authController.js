import { findByEmail, createUser } from "../models/userModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { saveRefreshToken, deleteRefreshToken } from "../models/tokenModel.js";
const saltRounds = 10;
const accessSecret = process.env.ACCESS_SECRET;
const refreshSecret = process.env.REFRESH_SECRET;

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

    const token = jwt.sign({ id: newUser.id }, accessSecret, {
      expiresIn: "1d",
    });

    res.cookie("refreshToken", token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });

    res
      .status(201)
      .json({ message: "Berhasil register user", data: newUser, token: token });
  } catch (error) {
    console.error(error);

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
    const { id: userId, password: savedPassword } = existingEmail;

    // Check password
    const isPasswordValid = await bcrypt.compare(password, savedPassword);

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid password" });
    }

    // Refresh token
    const refreshToken = jwt.sign({ id: userId }, refreshSecret, {
      expiresIn: "7d",
    });

    // Token
    const accessToken = jwt.sign({ id: userId }, accessSecret, {
      expiresIn: "15m",
    });

    const expiredAt = new Date();
    expiredAt.setDate(expiredAt.getDate() + 7);

    await saveRefreshToken(userId, refreshToken, expiredAt);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
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

    jwt.verify(token, refreshSecret, (err, user) => {
      if (err) return res.status(403).json({ error: "Invalid token" });

      const newAccessToken = jwt.sign({ id: user.id }, accessSecret, {
        expiresIn: "15m",
      });

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
