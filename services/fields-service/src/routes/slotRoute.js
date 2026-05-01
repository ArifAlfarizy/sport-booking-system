import express from "express";
import {
  getSlotsByField,
  getSlotById,
  createSlotController,
  updateSlotController,
  deleteSlotController,
  updateSlotStatus,
  getAllSlots,
} from "../controllers/slotController.js";

const slotRouter = express.Router();


// GET
slotRouter.get("/", getAllSlots);

// GET
slotRouter.get("/:id", getSlotById);

slotRouter.patch("/:id/status", updateSlotStatus);

// PUT
slotRouter.patch("/:id", updateSlotController);

// DELETE
slotRouter.delete("/:id", deleteSlotController);

export default slotRouter;
