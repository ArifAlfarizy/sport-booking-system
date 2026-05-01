import express from "express";
import {
  getSlotsByField,
  getSlotById,
  createSlotController,
  updateSlotController,
  deleteSlotController,
} from "../controllers/slotController.js";

const slotRouter = express.Router();

// GET
slotRouter.get("/:id", getSlotById);

// PUT
slotRouter.put("/:id", updateSlotController);

// DELETE
slotRouter.delete("/:id", deleteSlotController);

export default slotRouter;
