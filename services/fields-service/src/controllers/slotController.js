import {
  findSlotsByField,
  findSlotById,
  createSlot,
  updateSlot,
  deleteSlot,
} from "../models/slotModel.js";

// GET /fields/:id/slots
export const getSlotsByField = async (req, res) => {
  try {
    const { id } = req.params;
    const { day, status } = req.query;

    const slots = await findSlotsByField(id, day, status);

    res.json(slots);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /slots/:id
export const getSlotById = async (req, res) => {
  try {
    const slot = await findSlotById(req.params.id);

    if (!slot) {
      return res.status(404).json({ message: "Slot tidak ditemukan" });
    }

    res.json(slot);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /fields/:id/slots
export const createSlotController = async (req, res) => {
  try {
    const field_id = req.params.id;

    const slot = await createSlot({
      field_id,
      ...req.body,
    });

    res.status(201).json({
      message: "Slot berhasil dibuat",
      data: slot,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /slots/:id
export const updateSlotController = async (req, res) => {
  try {
    const updated = await updateSlot(req.params.id, req.body);

    res.json({
      message: "Slot berhasil diupdate",
      data: updated,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE /slots/:id
export const deleteSlotController = async (req, res) => {
  try {
    const deleted = await deleteSlot(req.params.id);

    res.json({
      message: "Slot berhasil dihapus",
      data: deleted,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
