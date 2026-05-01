import { findById, updateUser, deleteUser } from "../models/userModel.js";

// GET USER BY ID
export const getUserDetail = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({ message: "ID tidak valid" });
    }

    const user = await findById(id);

    if (!user) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    return res.status(200).json(user);
  } catch (err) {
    console.error("Get User Error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// UPDATE USER BY ID
export const updateUserController = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    if (!id || isNaN(id)) {
      return res.status(400).json({ message: "ID tidak valid" });
    }

    if (!data || Object.keys(data).length === 0) {
      return res.status(400).json({ message: "Data tidak boleh kosong" });
    }

    const existingUser = await findById(id);

    if (!existingUser) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    const updatedUser = await updateUser(id, data);

    return res.status(200).json({
      message: "User berhasil diupdate",
      data: updatedUser,
    });
  } catch (err) {
    console.error("Update User Error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// DELETE USER BY ID
export const deleteUserController = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({ message: "ID tidak valid" });
    }

    const existingUser = await findById(id);

    if (!existingUser) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    const deleted = await deleteUser(id);

    if (!deleted) {
      return res.status(500).json({ message: "Gagal menghapus user" });
    }

    return res.status(200).json({
      message: "User berhasil dihapus",
    });
  } catch (err) {
    console.error("Delete User Error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};