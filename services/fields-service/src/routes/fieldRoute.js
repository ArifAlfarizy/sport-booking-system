import express from "express";
import {
  createFieldController,
  deleteFieldController,
  getAllFields,
  getFieldById,
  updateFieldController,
} from "../controllers/fieldController.js";
import { createSlotController, getSlotsByField } from "../controllers/slotController.js";

const fieldRoute = express.Router();

fieldRoute.get("/", getAllFields);
fieldRoute.post("/", createFieldController);

fieldRoute.get("/:id/slots", getSlotsByField);
fieldRoute.post("/:id/slots", createSlotController);

fieldRoute.get("/:id", getFieldById);
fieldRoute.patch("/:id", updateFieldController);
fieldRoute.delete("/:id", deleteFieldController);

export default fieldRoute;