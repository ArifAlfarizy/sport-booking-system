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
    res.status(200).json(field);
  } catch (error) {
    console.error("Error", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

export const createFieldController = async (req, res) => {
  try {
    const { owner_id, name, type, address, city, status } = req.body;
    console.log(owner_id, name, type, address, city, status);

    if (!owner_id || !name || !type || !address || !city) {
      return res
        .status(400)
        .json({ message: "Field wajib diisi:  name, type, address, city," });
    }

    const newField = await createField({
      owner_id,
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
    const { id } = req.params;

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
    const { id } = req.params;

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
