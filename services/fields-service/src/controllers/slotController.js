import {
  findSlotsByField,
  findSlotById,
  createSlot,
  updateSlot,
  deleteSlot,
  findAllSlots,
} from "../models/slotModel.js";
import { findFieldById } from "../models/fieldModel.js";

// GET /fields/slots
export const getAllSlots = async (req, res) => {
  try {
    const { day, status, city, type, field_id, minPrice, maxPrice } = req.query;

    if (minPrice && isNaN(minPrice)) {
      return res
        .status(400)
        .json({ success: false, message: "minPrice harus berupa angka" });
    }
    if (maxPrice && isNaN(maxPrice)) {
      return res
        .status(400)
        .json({ success: false, message: "maxPrice harus berupa angka" });
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));

    const { rows, total } = await findAllSlots({
      day,
      status,
      city,
      type,
      field_id,
      minPrice,
      maxPrice,
      page,
      limit,
    });

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      message: "Berhasil mengambil data slots",
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      data: rows,
    });
  } catch (err) {
    console.error("Error", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

// GET /fields/:id/slots
export const getSlotsByField = async (req, res) => {
  try {
    const { id } = req.params;
    const { day, status } = req.query;

    const slots = await findSlotsByField(id, day, status);

    res.status(200).json(slots);
  } catch (err) {
    console.error("Error", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

// GET /slots/:id
export const getSlotById = async (req, res) => {
  try {
    const slot = await findSlotById(req.params.id);

    if (!slot) {
      return res.status(404).json({ message: "Slot tidak ditemukan" });
    }

    res.status(200).json(slot);
  } catch (err) {
    console.error("Error", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

const validateFieldOwnership = async (fieldId, ownerId) => {
  const field = await findFieldById(fieldId);

  if (!field) {
    return { valid: false, status: 404, message: "Lapangan tidak ditemukan" };
  }

  if (String(field.owner_id) !== String(ownerId)) {
    return {
      valid: false,
      status: 403,
      message: "Forbidden. Anda bukan pemilik lapangan ini",
    };
  }

  return { valid: true, field };
};


export const createSlotController = async (req, res) => {
  try {
    const role = req.headers["x-user-role"];

    if (role === "user") {
      return res
        .status(403)
        .json({ message: "Forbidden. Only owners can create slot" });
    }

    const ownerId = req.headers["x-user-id"];
    const field_id = req.params.id;

    // Validasi ownership
    const ownership = await validateFieldOwnership(field_id, ownerId);
    if (!ownership.valid) {
      return res
        .status(ownership.status)
        .json({ message: ownership.message });
    }

    const { day, start_time, end_time, price, dp_percent, status } = req.body;

    if (!day || !start_time || !end_time || !dp_percent || !price) {
      return res.status(400).json({
        message: "Field wajib diisi: day, start_time, end_time, price, dp_percent",
      });
    }

    const slot = await createSlot({
      field_id,
      day,
      start_time,
      end_time,
      price,
      dp_percent,
      status,
    });

    res.status(201).json({
      message: "Slot berhasil dibuat",
      data: slot,
    });
  } catch (err) {
    console.error("Error", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};


export const updateSlotController = async (req, res) => {
  try {
    const role = req.headers["x-user-role"];

    if (role === "user") {
      return res
        .status(403)
        .json({ message: "Forbidden. Only owners can update slot" });
    }

    const ownerId = req.headers["x-user-id"];
    const { id } = req.params;

    const slot = await findSlotById(id);
    if (!slot) {
      return res.status(404).json({ message: "Slot tidak ditemukan" });
    }

    // Validasi ownership lewat field_id yang ada di slot
    const ownership = await validateFieldOwnership(slot.field_id, ownerId);
    if (!ownership.valid) {
      return res
        .status(ownership.status)
        .json({ message: ownership.message });
    }

    const updated = await updateSlot(id, req.body);

    res.status(200).json({
      message: "Slot berhasil diupdate",
      data: updated,
    });
  } catch (err) {
    console.error("Error", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};


export const updateSlotStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Status wajib diisi" });
    }

    const slot = await findSlotById(id);
    if (!slot) {
      return res.status(404).json({ message: "Slot tidak ditemukan" });
    }

    const updated = await updateSlot(id, { status });

    res.status(200).json({
      message: "Status slot berhasil diupdate",
      data: updated,
    });
  } catch (err) {
    console.error("Error", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

export const deleteSlotController = async (req, res) => {
  try {
    const role = req.headers["x-user-role"];

    if (role === "user") {
      return res
        .status(403)
        .json({ message: "Forbidden. Only owners can delete slot" });
    }

    const ownerId = req.headers["x-user-id"];
    const { id } = req.params;

    const slot = await findSlotById(id);
    if (!slot) {
      return res.status(404).json({ message: "Slot tidak ditemukan" });
    }

    // Validasi ownership lewat field_id yang ada di slot
    const ownership = await validateFieldOwnership(slot.field_id, ownerId);
    if (!ownership.valid) {
      return res
        .status(ownership.status)
        .json({ message: ownership.message });
    }

    await deleteSlot(id);

    res.status(200).json({
      message: "Slot berhasil dihapus",
    });
  } catch (err) {
    console.error("Error", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};