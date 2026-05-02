
import {
  generateAccessToken,
  generateRefreshToken,
  saveRefreshToken,
} from "../utils/tokenHelper.js";

export const googleCallback = async (req, res) => {
  try {
    const user = req.user;

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await saveRefreshToken(user.id, refreshToken);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });

    return res.status(200).json({
      message: "Login dengan Google berhasil",
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        photo: user.photo, // atau user.avatar
      },
      tokens: {
        accessToken,
      },
    });
  } catch (err) {
    console.error("googleCallback error:", err);
    return res.status(500).json({
      message: "Terjadi kesalahan server",
    });
  }
};

export const googleFailure = (req, res) => {
  return res
    .status(401)
    .json({ message: "Login dengan Google gagal atau dibatalkan" });
};
