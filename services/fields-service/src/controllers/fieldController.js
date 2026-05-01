import {
  createField,
  deleteField,
  findAllFields,
  findFieldById,
  updateField,
} from "../models/fieldModel.js";

// GET : All fields
// GET : Field by id
// POST: Field
// PUT: Field
// DELETE: Field
// Tambahkan validasi jangan lupa dan catch errror

export const getAllFields = async (req, res) => {
  try {
    const fields = await findAllFields();

    res.status(200).json(fields);
  } catch (error) {
    console.error("Error", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

export const getFieldById = async (req, res) => {
  try {
    const { id } = req.params;
    const field = await findFieldById(id);

    if (!field) {
      return res.status(404).json({ success: false, message: "Field tidak ditemukan" });
    }

    res.status(200).json(field);
  } catch (error) {
    console.error("Error", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const createFieldController = async (req, res) => {
  try {
    const role = req.headers["x-user-role"];

    if (role === "user") {
      return res.status(403).json({ message: "Forbidden. Only owners can create field" });
    }

    const ownerId = req.headers["x-user-id"];
    console.log("owner id:", ownerId);

    const { name, type, address, city, status } = req.body;
    console.log(name, type, address, city, status);

    if (!name || !type || !address || !city) {
      return res
        .status(400)
        .json({ message: "Field wajib diisi:  name, type, address, city," });
    }

    const newField = await createField({
      owner_id: ownerId,
      name,
      type,
      address,
      city,
      status,
    });

    res.status(201).json({
      message: "Berhasil membuat field baru",
      data: newField,
    });
  } catch (err) {
    console.error("Error", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

export const updateFieldController = async (req, res) => {
  try {
    const role = req.headers["x-user-role"];
    console.log(role);

    if (role === "user") {
      return res.status(403).json({ message: "Forbidden. Only owners can create field" });
    }

    const ownerId = req.headers["x-user-id"];
    console.log("owner id:", ownerId);

    const { id } = req.params;

    const field = await findFieldById(id);

    if (ownerId !== field.owner_id) {
      return res
        .status(403)
        .json({ message: "Forbidden. You're not the owner" });
    }

    const updatedField = await updateField(id, req.body);

    res.status(200).json({
      message: "Field berhasil diupdate",
      data: updatedField,
    });
  } catch (err) {
    console.error("Error", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

export const deleteFieldController = async (req, res) => {
  try {
    const role = req.headers["x-user-role"];

    if (role === "user") {
      return res.status(403).json({ message: "Forbidden. Only owner can delete a field" });
    }

    const ownerId = req.headers["x-user-id"];
    console.log("owner id:", ownerId);

    const { id } = req.params;

    const field = await findFieldById(id);

    if (ownerId !== field.owner_id) {
      return res
        .status(403)
        .json({ message: "Forbidden you're not the owner" });
    }

    const deletedField = await deleteField(id);

    res.status(200).json({
      message: "Field berhasil dihapus",
    });
  } catch (err) {
    console.error("Error", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};
