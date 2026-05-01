import {
  findSlotsByField,
  findSlotById,
  createSlot,
  updateSlot,
  deleteSlot,
  findAllSlots,
} from "../models/slotModel.js";

// GET /fields/slots
export const getAllSlots = async (req, res) => {
  try {
    const slots = await findAllSlots();

    res.status(200).json(slots);
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

// GET /fields/:id/slots — semua role boleh lihat slot
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

// GET /slots/:id — semua role boleh lihat slot
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

// POST /fields/:id/slots — hanya owner
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

    // Validasi field milik owner ini bisa ditambahkan jika ada findFieldById di service ini
    const { day, start_time, end_time, price, status } = req.body;

    if (!day || !start_time || !end_time || !price) {
      return res.status(400).json({
        message: "Field wajib diisi: day, start_time, end_time, price",
      });
    }

    const slot = await createSlot({
      field_id,
      day,
      start_time,
      end_time,
      price,
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

// PUT /slots/:id — hanya owner
export const updateSlotController = async (req, res) => {
  try {
    const role = req.headers["x-user-role"];

    if (role === "user") {
      return res
        .status(403)
        .json({ message: "Forbidden. Only owners can update slot" });
    }

    const { id } = req.params;

    const slot = await findSlotById(id);

    if (!slot) {
      return res.status(404).json({ message: "Slot tidak ditemukan" });
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

// PATCH /slots/:id/status — internal only (dipanggil dari booking service)
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

// DELETE /slots/:id — hanya owner
export const deleteSlotController = async (req, res) => {
  try {
    const role = req.headers["x-user-role"];

    if (role === "user") {
      return res
        .status(403)
        .json({ message: "Forbidden. Only owners can delete slot" });
    }

    const { id } = req.params;

    const slot = await findSlotById(id);

    if (!slot) {
      return res.status(404).json({ message: "Slot tidak ditemukan" });
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
